import { LogIn } from "lucide-react"

export default function CoolButton() {
  return (
    <button className="group relative inline-flex items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-purple-600 to-blue-500 p-0.5 text-sm font-medium text-gray-900 hover:text-white focus:outline-none focus:ring-4 focus:ring-blue-300 group-hover:from-purple-600 group-hover:to-blue-500 dark:text-white dark:focus:ring-blue-800">
      <span className="relative flex items-center rounded-full bg-white px-5 py-2.5 transition-all duration-75 ease-in group-hover:bg-opacity-0 dark:bg-gray-900">
        <LogIn className="mr-2 h-4 w-4" />
        Login
      </span>
    </button>
  )
  
}