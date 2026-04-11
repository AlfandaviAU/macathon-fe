import { RouterProvider } from "react-router";
import { router } from "./routes";
import { ThemeProvider } from "next-themes";
import { Toaster } from "sonner";

export default function App() {
  return (
    <ThemeProvider attribute="class" defaultTheme="light" forcedTheme="light">
      <Toaster position="top-center" richColors />
      <RouterProvider router={router} />
    </ThemeProvider>
  );
}