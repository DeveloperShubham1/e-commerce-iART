const Loader = () => {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="animate-spin rounded-full h-16 w-16 border-4 border-gray-300 border-t-indigo-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Loading ...</p>
      </div>
    </div>
  );
};

export default Loader;
