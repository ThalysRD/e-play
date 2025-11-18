exports.up = (pgm) => {
  pgm.createTable("orders", {
    id: {
      type: "uuid",
      primaryKey: true,
      default: pgm.func("gen_random_uuid()"),
    },
    buyer_id: {
      type: "uuid",
      notNull: true,
      references: '"users"(id)',
    },
    listing_id: {
      type: "uuid",
      notNull: true,
      references: '"listings"(id)',
    },
    quantity: {
      type: "integer",
      notNull: true,
    },
    total_price: {
      type: "numeric",
      notNull: true,
    },
    status: {
      type: "varchar(50)",
      notNull: true,
      default: "pending",
    },
    tracking_code:{
      type: "varchar(50)",
    },
    address_street: {
      type: "varchar(255)",
    },
    address_number: {
      type: "varchar(50)",
    },
    address_complement: {
      type: "varchar(255)",
    },
    address_neighborhood: {
      type: "varchar(255)",
    },
    address_city: {
      type: "varchar(255)",
    },
    address_state: {
      type: "varchar(2)",
    },
    created_at: {
      type: "timestamp",
      notNull: true,
      default: pgm.func("current_timestamp"),
    },
    updated_at: {
      type: "timestamptz",
      notNull: true,
      default: pgm.func("timezone('utc', now())"),
    },
  });
};

exports.down = (pgm) => {
  pgm.dropTable("orders");
};
