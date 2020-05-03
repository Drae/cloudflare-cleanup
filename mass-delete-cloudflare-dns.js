// Now if you adding a domain with wildcard A record, Cloudflare uses strange scan, which added a 1000 trash domains (like 1-100, some english words like "ai", "air", "android").
// There's no way to bulk delete it, you can delete it only using their API.
// So I write a script that can help you with this problem.

// Discussions about same problem:
// https://community.cloudflare.com/t/delete-all-records-using-api/13410/2
// https://community.cloudflare.com/t/bulk-delete-dns-record/89540

const argv = require("yargs").options({
  email: {
    type: "string",
  },
  key: {
    type: "string",
  },
  domain: {
    type: "string",
  },
}).argv;

async function delete_dns() {
  const cloudflare = require("cloudflare")({
    email: argv.email,
    key: argv.key,
  });

  const zone_id = await cloudflare.zones
    .browse()
    .then((zones) => zones.result.find((x) => x.name === argv.domain).id);
  const info = await cloudflare.dnsRecords
    .browse(zone_id)
    .then((x) => x.result_info);

  console.log(`Pages to delete: ${info.total_pages}`);

  for (let i = 0; i < info.total_pages; i++) {
    const dns_records = await cloudflare.dnsRecords
      .browse(zone_id)
      .then((x) => x.result.map((dns_record) => dns_record.id));
    await Promise.all(
      dns_records.map((id) => cloudflare.dnsRecords.del(zone_id, id))
    );
    console.log(
      `Page ${i + 1} is deleted remained ${info.total_pages - i} pages`
    );
  }
}

delete_dns();
