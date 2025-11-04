import DevicesManager from "@/components/Devices/DevicesManager";

export default function DevicePage({ params }: { params: { id: string } }) {
  return (
    <div>
      <DevicesManager params={Promise.resolve(params)} />
    </div>
  );
}
