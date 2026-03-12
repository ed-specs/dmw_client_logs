import Link from "next/link";
import Image from "next/image";

export default function LoginPage() {
  return (
    <main className="text-base text-black bg-white">
      <div className="h-dvh container mx-auto flex items-center justify-center">
        <div className="flex flex-col gap-8  max-w-md w-full">
          {/* header */}
          <div className="flex flex-col gap-1 items-center justify-center">
            {/* logo */}
            <Image src="/dmw_logo.png" alt="DMW Logo" width={65} height={65} />
            <h1 className="text-2xl font-bold">
              Department of Migrant Workers
            </h1>
            <span className="text-gray-800 font-semibold">MIMAROPA Region</span>
          </div>

          {/* validation / error message */}
          <div className="hidden px-4 py-2 bg-red-100 text-red-700 rounded-lg border-l-4 border-red-500 text-sm">
            Error message here.
          </div>

          {/* form */}
          <form className="flex flex-col gap-6">
            <div className="flex flex-col gap-4">
              {/* email */}
              <div className="flex flex-col gap-1">
                <label htmlFor="">Email</label>
                <input
                  type="text"
                  placeholder="Enter your email"
                  className="border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors duration-150"
                />
              </div>
              {/* password */}
              <div className="flex flex-col gap-1">
                <label htmlFor="">Password</label>
                <input
                  type="text"
                  placeholder="Enter your password"
                  className="border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors duration-150"
                />
              </div>
            </div>
            <button
              type="submit"
              className="bg-blue-500 text-white rounded-lg px-4 py-2 hover:bg-blue-600 transition-colors duration-150 cursor-pointer"
            >
              Login
            </button>
          </form>

          {/* contact admin */}
          <div className="flex flex-col items-center justify-center gap-1 text-sm">
            <span className="text-gray-500 ">Having problems?</span>
            <Link
              href="mailto:admin@dmw.gov.ph"
              className="text-blue-500 hover:underline"
            >
              Contact Admin
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
