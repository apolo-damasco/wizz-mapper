export type Flight = {
  from: string;
  to: string;
  departure: string;
  arrival: string;
  availability: string;
};

function toIso(date: string, time: string, tz: string): string {
  const [d, m, y] = date.split("/").map((v) => Number.parseInt(v, 10));
  const [hh, mm] = time.split(":");
  const sign = tz.startsWith("-") ? "-" : "+";
  const hours = Math.abs(Number.parseInt(tz, 10));
  const tzStr = `${sign}${hours.toString().padStart(2, "0")}:00`;
  const yyyy = y.toString().padStart(4, "0");
  const MM = m.toString().padStart(2, "0");
  const dd = d.toString().padStart(2, "0");
  return `${yyyy}-${MM}-${dd}T${hh}:${mm}:00${tzStr}`;
}

export function parseWizzSchedule(text: string): Flight[] {
  console.log(text.length);
  const lines = text.split(/\r?\n/);
  const items: Flight[] = [];
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    if (/^No\./.test(line)) {
      i++;
      continue;
    }
    if (/^\d+\s/.test(line)) {
      let buf = line.trim();
      let j = i + 1;
      while (j < lines.length) {
        const lj = lines[j].trim();
        // biome-ignore lint/style/useTemplate: <explanation>
        buf += " " + lj;
        if (/(Available|Unavailable)\s*$/.test(lj)) break;
        j++;
      }
      const m = buf.match(
        /^\s*\d+\s+(.+?)\s-\s(.+?)\s(\d{2}\/\d{2}\/\d{4})\s\(.+?\)\s(\d{2}:\d{2})\s\(UTC([+-]\d+)\)\s-\s(\d{2}:\d{2})\s\(UTC([+-]\d+)\).*\s(Available|Unavailable)\s*$/,
      );
      if (m) {
        const from = m[1].trim();
        const to = m[2].trim();
        const date = m[3];
        const depTime = m[4];
        const depTz = m[5];
        const arrTime = m[6];
        const arrTz = m[7];
        const availability = m[8];
        // Overnight arrival handling (arrival next day if earlier than departure)
        let [dd, mm, yy] = date.split("/").map((v) => Number.parseInt(v, 10));
        if (arrTime < depTime) {
          const dt = new Date(Date.UTC(yy, mm - 1, dd));
          dt.setUTCDate(dt.getUTCDate() + 1);
          dd = dt.getUTCDate();
          mm = dt.getUTCMonth() + 1;
          yy = dt.getUTCFullYear();
        }
        const arrDate = `${String(dd).padStart(2, "0")}/${String(mm).padStart(2, "0")}/${String(yy)}`;
        const departure = toIso(date, depTime, depTz);
        const arrival = toIso(arrDate, arrTime, arrTz);
        items.push({ from, to, departure, arrival, availability });
      }
      i = j + 1;
      continue;
    }
    i++;
  }
  return items;
}
