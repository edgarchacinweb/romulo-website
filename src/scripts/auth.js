const authorize = async (role) => {
  const token = localStorage.getItem("auth");
  if (!token) window.location.href = "/app/iniciar-sesion/";
  const response = await fetch(`${window.APP_CONFIG.api_url}/user/get`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });

  const data = await response.json();

  if (data.Rol !== role) {
    window.location.href = "/app/iniciar-sesion.html";
    localStorage.clear();
  }
};

export default authorize;
