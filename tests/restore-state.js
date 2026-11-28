/* Test only. Puts saved localStorage values back in the test browser (window.__STATE = {v1, daily, prof}, each a JSON string or null). */
(function () {
  var st = window.__STATE || {};
  localStorage.clear();
  if (st.v1) { localStorage.setItem('antrenman-defteri-v1', st.v1); }
  if (st.daily) { localStorage.setItem('antrenman-defteri-daily-v1', st.daily); }
  if (st.prof) { localStorage.setItem('antrenman-defteri-profile-v1', st.prof); }
  location.hash = 'antrenman';
  location.reload();
  return 'restored';
})()
