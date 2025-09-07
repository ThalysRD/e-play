exports.up = (pgm) => {
  pgm.createTable("shipments", {
    shipment_id: "id",
    order_id: {
      type: "integer",
      notNull: true,
      references: '"orders"(id)"',
    },
    tracking_code: {
      type: "varchar(255)",
      notNull: true,
    },
    shipping_status: {
      type: "varchar(255)",
      notNull: true,
    },
    shipped_at: {
      type: "timestamp",
      notNull: true,
      default: pgm.func("current_timestamp"),
    },
  });
};

exports.down = (pgm) => {
  pgm.dropTable("shipments");
};
