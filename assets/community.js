/* 커뮤니티 — Supabase 회원제 게시판.
   assets/config.js 의 SUPABASE_URL / SUPABASE_ANON_KEY 를 채우면 자동 활성화됩니다.
   서버 쪽 테이블·보안 규칙은 supabase_schema.sql 참고. */
(function () {
  "use strict";
  var CFG = window.LMP_CONFIG || {};
  var $ = function (id) { return document.getElementById(id); };
  var setupPanel = $("setupPanel");
  var appPanel = $("communityApp");
  if (!appPanel) return;

  if (!CFG.SUPABASE_URL || !CFG.SUPABASE_ANON_KEY) {
    if (setupPanel) setupPanel.classList.remove("hidden");
    return; // 설정 전에는 게시판 비활성 (가짜 데이터를 보여주지 않음)
  }

  // Supabase SDK 동적 로드
  var sdk = document.createElement("script");
  sdk.src = "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.js";
  sdk.onload = init;
  sdk.onerror = function () {
    showMsg("커뮤니티 모듈을 불러오지 못했습니다. 네트워크 상태를 확인하세요.", true);
  };
  document.head.appendChild(sdk);

  var sb = null;
  var user = null;

  function maskEmail(email) {
    if (!email) return "익명";
    var name = email.split("@")[0];
    var head = name.slice(0, 3);
    var label = head + "***";
    if (CFG.ADMIN_EMAILS && CFG.ADMIN_EMAILS.indexOf(email) >= 0) label += " (운영자)";
    return label;
  }
  function showMsg(text, isErr) {
    var m = $("commMsg");
    if (!m) return;
    m.textContent = text;
    m.className = "msg " + (isErr ? "err" : "ok");
    if (text) setTimeout(function () { m.textContent = ""; }, 6000);
  }

  function init() {
    sb = window.supabase.createClient(CFG.SUPABASE_URL, CFG.SUPABASE_ANON_KEY);
    appPanel.classList.remove("hidden");

    $("btnLogin").addEventListener("click", function () { auth("login"); });
    $("btnSignup").addEventListener("click", function () { auth("signup"); });
    $("btnLogout").addEventListener("click", function () {
      sb.auth.signOut().then(function () { user = null; refreshAuthUI(); loadPosts(); });
    });
    $("btnPost").addEventListener("click", createPost);

    sb.auth.getSession().then(function (res) {
      user = res.data.session ? res.data.session.user : null;
      refreshAuthUI();
      loadPosts();
    });
  }

  function auth(mode) {
    var email = $("authEmail").value.trim();
    var pw = $("authPw").value;
    if (!email || !pw) return showMsg("이메일과 비밀번호를 입력하세요.", true);
    var call = mode === "signup"
      ? sb.auth.signUp({ email: email, password: pw })
      : sb.auth.signInWithPassword({ email: email, password: pw });
    call.then(function (res) {
      if (res.error) return showMsg(res.error.message, true);
      if (mode === "signup" && !res.data.session) {
        return showMsg("가입 확인 메일을 보냈습니다. 메일함에서 인증 후 로그인하세요.");
      }
      user = res.data.session ? res.data.session.user : null;
      refreshAuthUI();
      loadPosts();
      showMsg(mode === "signup" ? "가입 완료!" : "로그인 되었습니다.");
    });
  }

  function refreshAuthUI() {
    var loggedIn = !!user;
    $("authForms").classList.toggle("hidden", loggedIn);
    $("authInfo").classList.toggle("hidden", !loggedIn);
    $("writeBox").classList.toggle("hidden", !loggedIn);
    if (loggedIn) $("whoAmI").textContent = "접속: " + maskEmail(user.email);
  }

  function createPost() {
    var title = $("postTitle").value.trim();
    var content = $("postContent").value.trim();
    if (!title) return showMsg("제목을 입력하세요.", true);
    if (title.length > 120) return showMsg("제목은 120자 이내로 작성해 주세요.", true);
    if (!content) return showMsg("내용을 입력하세요.", true);
    if (content.length > 5000) return showMsg("글은 5,000자 이내로 작성해 주세요.", true);
    sb.from("posts").insert({ title: title, content: content, author_email: user.email }).then(function (res) {
      if (res.error) return showMsg(res.error.message, true);
      $("postTitle").value = "";
      $("postContent").value = "";
      showMsg("게시글이 등록되었습니다.");
      loadPosts();
    });
  }

  function updatePost(id, title, content) {
    if (!title) return showMsg("제목을 입력하세요.", true);
    if (!content) return showMsg("내용을 입력하세요.", true);
    return sb.from("posts").update({ title: title, content: content, updated_at: new Date().toISOString() })
      .eq("id", id).then(function (res) {
        if (res.error) { showMsg(res.error.message, true); return false; }
        showMsg("게시글이 수정되었습니다.");
        loadPosts();
        return true;
      });
  }

  function loadPosts() {
    sb.from("posts").select("*").order("created_at", { ascending: false }).limit(50)
      .then(function (res) {
        if (res.error) return showMsg(res.error.message, true);
        var posts = res.data || [];
        var ids = posts.map(function (p) { return p.id; });
        if (!ids.length) return renderPosts(posts, []);
        sb.from("comments").select("*").in("post_id", ids).order("created_at", { ascending: true })
          .then(function (cres) { renderPosts(posts, cres.data || []); });
      });
  }

  function renderPosts(posts, comments) {
    var wrap = $("postList");
    wrap.innerHTML = "";
    if (!posts.length) {
      var p = document.createElement("p");
      p.className = "msg";
      p.textContent = "아직 게시글이 없습니다. 첫 글을 남겨보세요!";
      wrap.appendChild(p);
      return;
    }
    posts.forEach(function (post) {
      var el = document.createElement("div");
      el.className = "post";

      var head = document.createElement("div");
      head.className = "p-head";
      var author = document.createElement("span");
      author.className = "p-author";
      author.textContent = maskEmail(post.author_email);
      var date = document.createElement("span");
      date.className = "p-date";
      date.textContent = (post.created_at || "").slice(0, 16).replace("T", " ") + (post.updated_at ? " (수정됨)" : "");
      head.appendChild(author);
      head.appendChild(date);
      el.appendChild(head);

      var titleEl = document.createElement("div");
      titleEl.className = "p-title";
      titleEl.textContent = post.title || "(제목 없음)";
      el.appendChild(titleEl);

      var body = document.createElement("div");
      body.className = "p-body";
      body.textContent = post.content; // XSS 방지: 항상 textContent
      el.appendChild(body);

      var editBox = document.createElement("div");
      editBox.className = "post-edit-box hidden";
      var editTitle = document.createElement("input");
      editTitle.type = "text";
      editTitle.className = "field";
      editTitle.maxLength = 120;
      var editContent = document.createElement("textarea");
      editContent.className = "field";
      editContent.maxLength = 5000;
      var editSave = document.createElement("button");
      editSave.className = "btn sm";
      editSave.textContent = "저장";
      var editCancel = document.createElement("button");
      editCancel.className = "btn ghost sm";
      editCancel.textContent = "취소";
      editBox.appendChild(editTitle);
      editBox.appendChild(editContent);
      editBox.appendChild(editSave);
      editBox.appendChild(editCancel);
      el.appendChild(editBox);

      if (user && user.id === post.author_id) {
        var edit = document.createElement("button");
        edit.className = "btn ghost sm";
        edit.textContent = "수정";
        edit.addEventListener("click", function () {
          editTitle.value = post.title || "";
          editContent.value = post.content;
          titleEl.classList.add("hidden");
          body.classList.add("hidden");
          editBox.classList.remove("hidden");
        });
        el.appendChild(edit);

        editCancel.addEventListener("click", function () {
          editBox.classList.add("hidden");
          titleEl.classList.remove("hidden");
          body.classList.remove("hidden");
        });
        editSave.addEventListener("click", function () {
          updatePost(post.id, editTitle.value.trim(), editContent.value.trim());
        });

        var del = document.createElement("button");
        del.className = "btn danger sm";
        del.textContent = "삭제";
        del.addEventListener("click", function () {
          if (!confirm("이 글을 삭제할까요?")) return;
          sb.from("posts").delete().eq("id", post.id).then(loadPosts);
        });
        el.appendChild(del);
      }

      // 댓글
      var cwrap = document.createElement("div");
      comments.filter(function (c) { return c.post_id === post.id; }).forEach(function (c) {
        var cel = document.createElement("div");
        cel.className = "comment";
        var ca = document.createElement("span");
        ca.className = "c-author";
        ca.textContent = maskEmail(c.author_email);
        cel.appendChild(ca);
        cel.appendChild(document.createTextNode(c.content));
        if (user && user.id === c.author_id) {
          var cdel = document.createElement("button");
          cdel.className = "btn danger sm";
          cdel.style.marginLeft = "8px";
          cdel.textContent = "×";
          cdel.addEventListener("click", function () {
            sb.from("comments").delete().eq("id", c.id).then(loadPosts);
          });
          cel.appendChild(cdel);
        }
        cwrap.appendChild(cel);
      });
      el.appendChild(cwrap);

      if (user) {
        var row = document.createElement("div");
        row.className = "comment-row";
        var input = document.createElement("input");
        input.className = "field";
        input.placeholder = "댓글을 입력하세요…";
        input.maxLength = 1000;
        var btn = document.createElement("button");
        btn.className = "btn sm";
        btn.textContent = "등록";
        btn.addEventListener("click", function () {
          var t = input.value.trim();
          if (!t) return;
          sb.from("comments").insert({ post_id: post.id, content: t, author_email: user.email })
            .then(function (res) {
              if (res.error) return showMsg(res.error.message, true);
              loadPosts();
            });
        });
        row.appendChild(input);
        row.appendChild(btn);
        el.appendChild(row);
      }

      wrap.appendChild(el);
    });
  }
})();
