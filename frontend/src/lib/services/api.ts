export async function fetchDevices(signal?: AbortSignal) {
   try {

      const res = await fetch("http://localhost:3001/api/devices", {
         // `next` options are ignored on the client; keeping for possible server usage
         next: { revalidate: 5 },
         signal,
      });


      const json = await res.json();

      console.log("devices fetched", json);

      return json.data ?? [];
   } catch (err: unknown) {
      // If aborted, return current-safe empty list
      if (
         typeof err === "object" &&
         err !== null &&
         "name" in err &&
         (err as { name?: unknown }).name === "AbortError"
      ) {
         return [];
      }
      return [];
   }
}
