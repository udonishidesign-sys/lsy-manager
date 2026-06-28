type DriverHeaderProps = {
    name: string;
  };
  
  export default function DriverHeader({
    name,
  }: DriverHeaderProps) {
    return (
      <div className="bg-white rounded-lg p-3 pt-2 pb-1">
        <p className="text-xs text-gray-400">
          ログイン中
        </p>
  
        <h1 className="text-md font-bold text-slate-700">
          {name}
        </h1>
      </div>
    );
  }