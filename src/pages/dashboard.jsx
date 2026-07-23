export default function Dashboard({ onLogout }) {
  return (
    <main
      style={{
        minHeight: "100svh",
        display: "grid",
        placeItems: "center",
        fontFamily: "Inter, Arial, sans-serif",
        background: "#f4f7fd",
        color: "#091c45",
      }}
    >
      <section style={{ textAlign: "center" }}>
        <h1>Welcome to your dashboard</h1>
        <p>You have successfully logged in.</p>
        <button
          onClick={onLogout}
          style={{
            marginTop: 20,
            border: 0,
            borderRadius: 8,
            background: "#0b5fe7",
            color: "#fff",
            padding: "12px 22px",
            cursor: "pointer",
          }}
        >
          Log out
        </button>
      </section>
    </main>
  );
}
