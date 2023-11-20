import { SignInButton, SignUpButton } from "@clerk/nextjs";
import Logo from "../public/logo.png";
import Image from "next/image";
export default function Home() {
    return (
        <div className="flex flex-col lg:flex-row h-screen">
            <div className="w-full lg:w-[60vw] p-8 lg:bg-green-100 flex flex-col">
                <div className="flex justify-center lg:justify-start">
                    <Image src={Logo} alt="" width={350} height={350} />
                </div>

                <div className="flex-1 flex justify-start items-center pt-96 lg:pt-0">
                    <div className="text-center lg:text-left">
                        <h1 className="text-5xl font-bold text-green-950">
                            Get your emotion details right away!
                        </h1>
                        <p className="text-2xl pt-6">
                            We provide emotion details based on the text you
                            enter using NLP
                        </p>
                    </div>
                </div>
            </div>

            <div className="w-full lg:w-[40vw] flex flex-col justify-center items-center">
                <h1 className="pb-6 text-2xl font-bold">Get Started</h1>
                <div className="flex space-x-4 md:space-x-6 justify-center items-center">
                    <SignInButton
                        mode="modal"
                        className="bg-blue-700 text-white px-16 py-2 rounded-md hover:bg-blue-600"
                    >
                        Log In
                    </SignInButton>

                    <SignUpButton
                        mode="modal"
                        className="bg-gray-300 text-gray-700 px-16 py-2 rounded-md hover:bg-gray-400"
                    >
                        Sign Up
                    </SignUpButton>
                </div>
            </div>
        </div>
    );
}
