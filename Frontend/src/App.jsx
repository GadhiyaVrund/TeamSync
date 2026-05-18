import { Switch, Route } from "wouter";
import LandingPage from "./pages/LandingPage";
import DashboardPage from "./pages/DashboardPage";

function App() {
  return (
    <Switch>
      <Route path="/" component={LandingPage} />
      <Route path="/login">
        <LandingPage initialAuthOpen initialAuthTab="login" />
      </Route>
      <Route path="/app" component={DashboardPage} />
      <Route>
        <div className="flex min-h-screen items-center justify-center bg-gray-50">
          <div className="text-center">
            <h1 className="text-4xl font-bold mb-4">404 Not Found</h1>
            <a href="/" className="text-primary hover:underline">Return Home</a>
          </div>
        </div>
      </Route>
    </Switch>
  );
}

export default App;
