defmodule Pixelwall.WallChannel do
  use Phoenix.Channel
  require Logger

  defp handle_put(%{"wall" => wall_name, "x" => x, "y" => y, "color" => color}) do
    Logger.debug("We want to put #{color} at #{x},#{y}")
    {:ok, registry} = Pixelwall.WallServerRegistry.start_link
    wall_server = registry |> Pixelwall.WallServerRegistry.lookup(wall_name)
    if (is_integer(x) && is_integer(y)) do
      Pixelwall.WallServer.put!(wall_server, x, y, color)
    else
      x = elem(Integer.parse(x), 0)
      y = elem(Integer.parse(y), 0)
      Pixelwall.WallServer.put!(wall_server, x, y, color)
    end
  end

  def join("wall:" <> wall_name, auth_msg, socket) do
    {:ok, socket}
  end

  def handle_in("put", data, socket) do
    handle_put(data)
    broadcast socket, "put", data
    {:noreply, socket}
  end

end
