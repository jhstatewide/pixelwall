use Mix.Config

# We don't run a server during test. If one is required,
# you can enable the server option below.
config :pixelwall, Pixelwall.Endpoint,
  http: [port: 4001],
  server: false

# Print only warnings and errors during test
config :logger, level: :warn

# Set a higher stacktrace during test
config :phoenix, :stacktrace_depth, 20

# Configure your database
config :pixelwall, Pixelwall.Repo,
  adapter: Mongo.Ecto,
  hostname: System.get_env("MONGODB_ADDRESS") || "localhost",
  port: (System.get_env("MONGODB_PORT") || 27017) |> Pixelwall.Utils.to_integer,
  database: "pixelwall_test",
  pool_size: 1
