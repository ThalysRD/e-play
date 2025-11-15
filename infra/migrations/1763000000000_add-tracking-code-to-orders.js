exports.up = (pgm) => {
  pgm.addColumns("orders", {
    tracking_code: {
      type: "varchar(255)",
    },
  });
};

exports.down = (pgm) => {
  pgm.dropColumns("orders", ["tracking_code"]);
};
