defmodule Pixelwall.WallChannel do
  use Phoenix.Channel
  require Logger

  defp handle_put(draw_object) do
    type = draw_object["type"]
    x = Pixelwall.Utils.to_integer(draw_object["x"])
    y = Pixelwall.Utils.to_integer(draw_object["y"])
    color = draw_object["color"]
    wall_name = draw_object["wall"]
    {:ok, registry} = Pixelwall.WallServerRegistry.start_link
    wall_server = registry |> Pixelwall.WallServerRegistry.lookup(wall_name)

    case type do
      "pixel" ->
        Pixelwall.WallServer.put(wall_server, x, y, color)
      "circle" ->
        Pixelwall.WallServer.put_circle(wall_server, x, y, color, Pixelwall.Utils.to_integer(draw_object["size"]))
      unknown_type ->
        raise "Can't handle type #{unknown_type}"
    end

  end

  def join("wall:" <> wall_name, auth_msg, socket) do
    {:ok, socket}
  end

  def handle_in("put_multi", data, socket) do
    # TODO: just pass through all the data... don't bother sending 
    # one at a time
    data |> Enum.each(fn(p)->
      handle_put(p)
    end)
    broadcast socket, "put_multi", %{commands: data}
    {:noreply, socket}
  end

  def handle_in("put", data, socket) do
    handle_put(data)
    broadcast socket, "put", data
    {:noreply, socket}
  end

end
