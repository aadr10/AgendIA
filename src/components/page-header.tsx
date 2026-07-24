export default function PageHeader({ title }: { title: string }) {
  const date = new Intl.DateTimeFormat("fr-BE", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date());

  return (
    <div className="mb-5 flex items-center justify-between">
      <h1 className="text-xl font-semibold">{title}</h1>
      <span className="text-sm capitalize text-slate-400">{date}</span>
    </div>
  );
}
