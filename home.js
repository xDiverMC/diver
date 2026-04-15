document.addEventListener("DOMContentLoaded", function () {
  const logout = document.querySelector("#logout");
  const player = document.querySelector("#playerName");
  const coins = document.querySelectorAll(".coin");
  const regexName = /^[a-zA-Z0-9_]{3,16}$/;

  let savedName = localStorage.getItem("userName");
  let savedVersion = localStorage.getItem("version");
  const discount = parseFloat(document.querySelector('meta[name="discount"]')?.content || "0");

  function formatPrice(number) {
    return Math.round(number * 100) / 100;
  }

  // Ubah title & nav label kalau ada diskon
  if (discount > 0) {
    const percent = Math.round(discount * 100);
    document.title = `YezCraft Topup - ${percent}% OFF`;

    const navLabel = document.querySelector("nav .logo");
    if (navLabel) {
      navLabel.textContent = `YezCraft Topup - ${percent}% OFF`;
    }

    const ogTitle = document.querySelector('meta[property="og:title"]');
    if (ogTitle) {
      ogTitle.setAttribute("content", `YezCraft Topup - ${percent}% OFF`);
    }
  }

  function renderPrices() {
    coins.forEach((coin) => {
      const basePrice = parseInt(coin.getAttribute("data-price")) || 0;
      const finalPrice = formatPrice(basePrice * (1 - discount));

      const original = `<span class="original-price">Rp ${basePrice.toLocaleString("id-ID")}</span>`;
      const discounted = `<span class="discounted-price">Rp ${finalPrice.toLocaleString("id-ID")}</span>`;

      coin.querySelector(".coin-price p").innerHTML =
        discount > 0 ? `${original}${discounted}` : `Rp ${basePrice.toLocaleString("id-ID")}`;
    });
  }

  async function login() {
    let version = "";
    const versionSelect = await Swal.fire({
      title: "Kamu bermain dimana?",
      showDenyButton: true,
      background: "rgb(29, 28, 28)",
      color: "#fff",
      confirmButtonText: "Java",
      denyButtonText: "Bedrock",
      denyButtonColor: "#7066e0",
      showLoaderOnConfirm: true,
      allowOutsideClick: false,
    });

    if (versionSelect.isDenied) version = ".";

    const usernameInput = await Swal.fire({
      title: "Masukkan Username",
      input: "text",
      background: "rgb(29, 28, 28)",
      color: "#fff",
      inputAttributes: { autocapitalize: "off" },
      confirmButtonText: "Submit",
      showLoaderOnConfirm: true,
      allowOutsideClick: false,
      inputValidator: (value) => {
        if (!value) return "Username tidak boleh kosong!";
        if (!regexName.test(value)) return "Username tidak valid!";
      },
    });

    if (usernameInput.isConfirmed) {
      const userName = usernameInput.value;
      localStorage.setItem("version", version);
      localStorage.setItem("userName", version + userName);

      savedName = version + userName;
      savedVersion = version;

      player.textContent = "Hi, " + savedName;

      await Swal.fire({
        title: `Hello, ${userName}!`,
        icon: "success",
        background: "rgb(29, 28, 28)",
        color: "#fff",
      });
    }
  }

  logout?.addEventListener("click", async function (event) {
    event.preventDefault();
    if (savedName) {
      player.textContent = "No Account.";
      localStorage.removeItem("userName");
      localStorage.removeItem("version");
      savedName = null;
      savedVersion = null;

      await Swal.fire({
        title: "Successfully Logged Out",
        icon: "success",
        background: "rgb(29, 28, 28)",
        color: "#fff",
      });
    } else {
      await Swal.fire({
        title: "You are not logged in",
        icon: "error",
        background: "rgb(29, 28, 28)",
        color: "#fff",
      });
    }
    await login();
  });

  if (!savedName) login();
  else player.textContent = "Hi, " + savedName;

  coins.forEach((coin) => {
    coin.addEventListener("click", function () {
      if (!savedName) {
        Swal.fire({
          title: "Kamu harus login dulu!",
          icon: "warning",
          background: "rgb(29, 28, 28)",
          color: "#fff",
        });
        return;
      }

      const basePrice = parseInt(coin.getAttribute("data-price")) || 0;
      const credits = Math.floor(basePrice / 10);
      const finalPrice = formatPrice(basePrice * (1 - discount));

      Swal.fire({
        title: `Scan QRIS untuk bayar`,
        html: `
          <p>Username: <b>${savedName}</b></p>
          <p>Minecraft: <b>${savedVersion === "." ? "Bedrock" : "Java"}</b></p>
          <p>Nominal yang harus di bayar:</p>
          <p style="color:#ff0;"><b>Rp ${finalPrice.toLocaleString("id-ID")}</b></p>
          <div style="margin-top:20px;">
            <img src="/assets/img/qris.png" alt="QRIS" style="width:250px;height:250px;"/>
          </div>
        `,
        footer: `<p style="color:#ff0;">Upload bukti pembayaran setelah transfer berhasil!</p>`,
        background: "rgb(29, 28, 28)",
        showCancelButton: true,
        color: "#fff",
        confirmButtonText: "Kirim Bukti Pembayaran",
        cancelButtonText: "Kembali",
      }).then((res) => {
        if (res.isConfirmed) {
          Swal.fire({
            title: "Upload Bukti Pembayaran",
            input: "file",
            inputAttributes: { accept: "image/*" },
            showCancelButton: true,
            confirmButtonText: "Kirim",
            cancelButtonText: "Batal",
            background: "rgb(29, 28, 28)",
            color: "#fff",
          }).then(async (uploadRes) => {
            if (uploadRes.isConfirmed && uploadRes.value) {
              const file = uploadRes.value;

              const formData = new FormData();
              formData.append("file", file);
              formData.append("minecraft", savedVersion === "." ? "Bedrock" : "Java");
              formData.append("username", savedName);
              formData.append("credits", credits);
              formData.append("price", finalPrice);

              fetch("/api/upload", {
                method: "POST",
                body: formData,
              })
                .then((r) => r.json())
                .then((data) => {
                  Swal.fire({
                    title: "Terima kasih!",
                    text: "Bukti pembayaran sudah terkirim. Admin akan memproses secepatnya!",
                    icon: "success",
                    background: "rgb(29, 28, 28)",
                    color: "#fff",
                  });
                  console.log("Bukti terkirim:", data);
                })
                .catch((err) => {
                  Swal.fire({
                    title: "Gagal!",
                    text: "Terjadi error saat mengirim bukti.",
                    icon: "error",
                    background: "rgb(29, 28, 28)",
                    color: "#fff",
                  });
                  console.error("Error:", err);
                });
            }
          });
        }
      });
    });
  });

  renderPrices();
});
