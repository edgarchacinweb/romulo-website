document.addEventListener("DOMContentLoaded", function () {
  const form = document.getElementById("enrollmentForm");
  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const studentName = document.getElementById("student_name").value;
    const studentIdentity = document.getElementById("student_identity").value;
    const studentPhoto =
      document.getElementById("foto_estudiante").selectedFiles[0];
    const studentDoc =
      document.getElementById("doc_representante").selectedFiles[0];
    const parentName = document.getElementById("rep_name").value;
    const parentIdentity = document.getElementById("rep_ci").value;
    const parentEmail = document.getElementById("rep_email").value;
    const parentPhoto =
      document.getElementById("foto_representante").selectedFiles[0];
    const parentDoc =
      document.getElementById("doc_representante").selectedFiles[0];
  });
});
