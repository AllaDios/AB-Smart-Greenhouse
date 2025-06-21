import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Dashboard from "@/pages/dashboard";
import Irrigation from "@/pages/irrigation";
import Ventilation from "@/pages/ventilation";
import Configuration from "@/pages/configuration";
import Alerts from "@/pages/alerts";
import History from "@/pages/history";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route path="/irrigation" component={Irrigation} />
      <Route path="/ventilation" component={Ventilation} />
      <Route path="/configuration" component={Configuration} />
      <Route path="/alerts" component={Alerts} />
      <Route path="/history" component={History} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
