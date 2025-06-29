<template>
  <div class="app-container">
    <header class="navbar navbar-expand-lg navbar-dark bg-dark">
      <div class="container">
        <a class="navbar-brand" href="#">Camera Streaming System</a>
        <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav">
          <span class="navbar-toggler-icon"></span>
        </button>
        <div class="collapse navbar-collapse" id="navbarNav">
          <ul class="navbar-nav">
            <li class="nav-item">
              <router-link class="nav-link" to="/live">Live View</router-link>
            </li>
            <li class="nav-item">
              <router-link class="nav-link" to="/history">History</router-link>
            </li>
            <li class="nav-item">
              <router-link class="nav-link" to="/settings">Settings</router-link>
            </li>
          </ul>
        </div>
      </div>
    </header>
    
    <main class="container mt-4">
      <router-view></router-view>
    </main>
    
    <footer class="footer mt-5 py-3 bg-light">
      <div class="container text-center">
        <span class="text-muted">Camera Streaming System &copy; 2025</span>
      </div>
    </footer>
  </div>
</template>

<script>
export default {
  name: 'App',
}
</script>

<style>
.app-container {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

main {
  flex: 1;
}

.footer {
  margin-top: auto;
}
</style>