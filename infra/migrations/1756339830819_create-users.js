exports.up = (pgm) => {
  pgm.createTable("users", {
    id: {
      type: "uuid",
      primaryKey: true,
      default: pgm.func("gen_random_uuid()"),
    },
    name: {
      type: "varchar(255)",
      notNull: true,
    },
    username: {
      type: "varchar(30)",
      notNull: true,
      unique: true,
    },
    email: {
      type: "varchar(254)",
      notNull: true,
      unique: true,
    },
    password: {
      type: "varchar(255)",
      notNull: true,
    },
    permissions: {
      type: "varchar[]",
      notNull: true,
    },
    wish_list: {
      type: "varchar[]",
    },
    cpf: {
      type: "varchar(11)",
      unique: true,
    },
    cnpj: {
      type: "varchar(14)",
      unique: true,
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
    address_zipcode: {
      type: "varchar(10)",
    },
    profile_image_url: {
      type: "varchar(500)",
    },
    phone_number: {
      type: "varchar(20)",
    },
    profile_bio: {
      type: "text",
    },
    status: {
      type: "varchar(20)",
      notNull: true,
      default: "active",
    },
    seller_rating: {
      type: "decimal(3,2)",
      default: 0.0,
    },
    sales_count: {
      type: "integer",
      notNull: true,
      default: 0,
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
  pgm.dropTable("users");
};
