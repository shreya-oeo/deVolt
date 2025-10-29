import nm from "nodemailer";

const nmtx = nm.createTransport({
  service: "gmail",
  auth: {
    user: process.env.NM_UNAME,
    pass: process.env.NM_UPASS
  },
})

export default nmtx;