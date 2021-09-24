const mongoose = require("mongoose");
const request = require("supertest");
const api = require("../server");

const uri = "http://localhost:5000/";

// jest.mock("supertest");

beforeAll(async () => {
  await mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useCreateIndex: true,
    useFindAndModify: false,
  });

  console.log("mongo connected");
});

afterAll(async () => {
  await mongoose.disconnect();
  console.log("mongo disconnected");
});

//check server is running properly
test("Should send a string of CF-EF-BRIDGE API IS RUNNING", async function () {
  request(api).get("/").expect(200);
});

// test("Should post cf data to everflow", function (done) {
//   request(api)
//     .post("/api/cf-data/")
//     .end((err, res) => {
//       if (err) done(err);
//       console.log("test result", res.body);
//       expect(res).to.have.status(200);
//       expect(res).to.be.an("object");
//       done();
//     });
// });

// test("Should return a status of 200", function (done) {
//   request(api)
//     .post("/api/cf-data/pg")
//     .end((err, res) => {
//       if (err) done(err);
//       console.log("test result", res.body);
//       expect(res).to.have.status(200);
//       expect(res).to.be.an("object");
//       done();
//     });
// });

// test("Should return a status of 200", function (done) {
//   request(api)
//     .post("/api/cf-data/slick")
//     .end((err, res) => {
//       if (err) done(err);
//       console.log("test result", res.body);
//       expect(res).to.have.status(200);
//       expect(res).to.be.an("object");
//       done();
//     });
// });

// test("Should return a status of 200", function (done) {
//   request(api)
//     .post("/api/cf-data/lulu")
//     .end((err, res) => {
//       if (err) done(err);
//       console.log("test result", res.body);
//       expect(res).to.have.status(200);
//       expect(res).to.be.an("object");
//       done();
//     });
// });
