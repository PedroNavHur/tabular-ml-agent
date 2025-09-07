import RunsClient from "./RunsClient";

export default function Page({ params }: { params: { id: string } }) {
  return <RunsClient id={params.id} />;
}

