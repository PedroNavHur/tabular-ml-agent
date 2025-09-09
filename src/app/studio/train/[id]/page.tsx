import TrainClient from "./TrainClient";

export default function Page({ params }: { params: { id: string } }) {
  return <TrainClient id={params.id} />;
}
