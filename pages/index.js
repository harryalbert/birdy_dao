import Image from "next/image";

export default function Home() {

  return (
    <div className="bg-light">
      <div className="flex justify-between items-center drop-shadow bg-white p-2">
        <div className="flex flex-row items-center">
          <Image src="/images/logo.svg" height={50} width={77} alt="birdy logo" />
          <h1 className="title pl-3"> BirdyDAO </h1>
        </div>
        <div>
          <button className="rounded-md bg-main py-0 px-4 h-min">
            <text className="text-white mediumText">Join</text>
          </button>
        </div>
      </div>
    </div>)
}
