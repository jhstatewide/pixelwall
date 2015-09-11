defmodule Pixelwall.PageController do
  use Pixelwall.Web, :controller

  def index(conn, _params) do
    render conn, "index.html"
  end
end
