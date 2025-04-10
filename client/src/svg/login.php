<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Login - GP Digital Solutions</title>
  <link rel="stylesheet" href="../css/styles.css" />
  <link rel="stylesheet" href="../css/login.css" />
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;800&display=swap" rel="stylesheet">
</head>
<body>
  <header>
    <div class="nav-container">
      <div class="logo">GP<span>.</span></div>
      <nav>
        <ul class="nav-links">
          <li><a href="index.html">Home</a></li>
          <li><a href="#">About</a></li>
          <li><a href="#">Services</a></li>
          <li><a href="#contact">Contact</a></li>
        </ul>
      </nav>
    </div>
  </header>

  <section class="login-section">
    <div class="login-container">
      <h2>Login</h2>
      <form class="login-form" method="POST" action="">
        <input type="email" name="email" placeholder="Email" required />
        <input type="password" name="password" placeholder="Password" required />
        <button type="submit">Login</button>
      </form>
      <p class="signup-link">Don't have an account? <a href="#">Sign up</a></p>
    </div>
  </section>

  <?php
    if ($_SERVER['REQUEST_METHOD'] === 'POST') {
      $email = $_POST['email'];

      // Database connection
      $servername = "localhost";
      $username = "root";
      $password = "";
      $dbname = "gestion_materiel";

      $conn = new mysqli($servername, $username, $password, $dbname);

      if ($conn->connect_error) {
        die("Connection failed: " . $conn->connect_error);
      }

      // Check if the user exists and get their role
      $stmt = $conn->prepare("SELECT rôle FROM Utilisateur WHERE email = ?");
      $stmt->bind_param("s", $email);
      $stmt->execute();
      $stmt->bind_result($role);
      $stmt->fetch();
      $stmt->close();
      $conn->close();

      if ($role) {
        if ($role === 'etudiant') {
          header("Location: etudiant.php");
          exit();
        } elseif ($role === 'technicien') {
          header("Location: technicien.php");
          exit();
        }
        elseif ($role === 'responsable') {
          header("Location: responsable.php");
          exit();
        }
      } else {
        echo "<p style='color: red; text-align: center;'>User not found.</p>";
      }
    }
  ?>
</body>
</html>