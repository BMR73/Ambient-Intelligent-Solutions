
async function pollOrder() {
  try {
    const res = await fetch("/api/order/latest");
    const order = await res.json();

    document.getElementById("order").innerText =
      JSON.stringify(order, null, 2);
  } catch (err) {
    console.error("Error fetching order:", err);
  }
}

setInterval(pollOrder, 2000);
