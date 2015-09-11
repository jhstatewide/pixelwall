defmodule Pixelwall.Router do
  use Pixelwall.Web, :router

  pipeline :browser do
    plug :accepts, ["html"]
    plug :fetch_session
    plug :fetch_flash
    plug :protect_from_forgery
    plug :put_secure_browser_headers

    IO.puts("Starting static plug at: #{System.cwd}")
    plug Plug.Static, at: "/img", from: {:pixelwall, "priv/static/img"}
  end

  pipeline :api do
    plug :accepts, ["json"]
  end

  scope "/", Pixelwall do
    pipe_through :browser # Use the default browser stack

    get "/", PageController, :index
  end

  # Other scopes may use custom stacks.
  scope "/api", Pixelwall do
     pipe_through :api
     get "/wall/:name/pixel/:x/:y", WallController, :pixel
     get "/wall/:name/row/:start_x/:end_x/:row", WallController, :row
  end
end
