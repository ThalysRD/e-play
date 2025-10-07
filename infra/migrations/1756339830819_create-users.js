exports.up = (pgm) => {
  pgm.createTable("users", {
    id: "id",
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
    role: {
      type: "varchar(20)",
      notNull: true,
    },
    cpf: {
      type: "varchar(11)",
      unique: true,
    },
    cnpj: {
      type: "varchar(14)",
      unique: true,
    },
    address: {
      type: "varchar(255)",
    },
    zip_code: {
      type: "varchar(255)",
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
