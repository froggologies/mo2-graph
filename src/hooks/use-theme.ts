import { useState, useEffect } from "react"

export function useTheme() {
  const [isDarkMode, setIsDarkMode] = useState(false)

  useEffect(() => {
    const theme = localStorage.getItem("theme")
    if (theme === "dark" || (!theme && window.matchMedia("(prefers-color-scheme: dark)").matches)) {
      document.documentElement.classList.add("dark")
      setIsDarkMode(true)
    } else {
      document.documentElement.classList.remove("dark")
      setIsDarkMode(false)
    }
  }, [])

  const toggleDarkMode = () => {
    const isDark = document.documentElement.classList.toggle("dark")
    setIsDarkMode(isDark)
    localStorage.setItem("theme", isDark ? "dark" : "light")
  }

  return { isDarkMode, toggleDarkMode }
}
