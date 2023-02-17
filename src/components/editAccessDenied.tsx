export function EditAccessDenied() {
  return (
    <div className=" flex h-screen w-screen items-center justify-center bg-zinc-900 bg-gradient-to-br">
      <div className="rounded-md bg-white px-40 py-20 shadow-xl">
        <div className="flex flex-col items-center">
          <h6 className="mb-2 text-center text-2xl font-bold text-gray-800 md:text-3xl">
            Access denied
          </h6>

          <div className="mb-8 text-center text-gray-500 md:text-lg">
            <span>You don&apos;t have permissions to edit the guide</span>
          </div>
        </div>
      </div>
    </div>
  );
}
