import { SignInButton, SignUpButton } from "@clerk/nextjs";

export default function Home() {
    return (
        <div className="flex">
            <div className="h-screen w-[60vw] bg-green-100 pl-4 flex flex-col justify-center">
                <div className="flex mb-10">
                    <span className="text-2xl font-bold text-gray-800">
                        TextEmote
                    </span>
                </div>

                <div className="flex flex-col">
                    <h1 className="text-4xl font-bold">
                        Get your emotion details right away!
                    </h1>
                    <p className="text-base pt-4">
                        We provide emotion details based on the text you enter
                        using NLP
                    </p>
                </div>
            </div>

            <div className="h-screen w-[40vw] flex flex-col justify-center items-center">
                <h1 className="pb-4 text-2xl font-bold">Get Started</h1>
                <div className="flex space-x-4 md:space-x-8 items-center">
                    <SignInButton
                        mode="modal"
                        className="bg-blue-500 text-white px-12 py-3 rounded-md hover:bg-blue-600"
                    >
                        Log In
                    </SignInButton>

                    <SignUpButton
                        mode="modal"
                        className="bg-gray-300 text-gray-700 px-12 py-3 rounded-md hover:bg-gray-400"
                    >
                        Sign Up
                    </SignUpButton>
                </div>
            </div>
        </div>
    );
}
