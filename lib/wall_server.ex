defmodule Pixelwall.WallServer do
  use GenServer
  require Logger

  def start_link(default) do
    GenServer.start_link(__MODULE__, default)
  end

  # asynchronous
  def put(pid, x, y, color) do
    GenServer.cast(pid, {:put, x, y, color})
  end

  # synchronous
  def put!(pid, x, y, color) do
    GenServer.call(pid, {:put, x, y, color})
  end

  def put_circle(pid, x, y, color, size) do
    GenServer.cast(pid, {:put_circle, x, y, color, size})
  end

  def put_circle!(pid, x, y, color, size) do
    GenServer.call(pid, {:put_circle, x, y, color, size})
  end

  def get(pid, x, y) do
    GenServer.call(pid, {:get, x, y})
  end

  def get_row(pid, start_x, end_x, row_number) do
    GenServer.call(pid, {:get_row, start_x, end_x, row_number})
  end

  def init(args) do
    wall = (Pixelwall.Repo.get_by(Pixelwall.Wall, name: args[:name]) || %Pixelwall.Wall{name: args[:name]})
    |> Pixelwall.Wall.load_pixels
    {:ok, wall}
  end

  def handle_cast({:put, x, y, color}, wall) do
    {:noreply, wall |> Pixelwall.Wall.put(x, y, color)}
  end

  defp put_many_coords(wall, [coord | coords], color) do
    {x, y} = coord
    put_many_coords(wall |> Pixelwall.Wall.put(x, y, color), coords, color)
  end

  defp put_many_coords(wall, [], color) do
    wall
  end

  def handle_cast({:put_circle, x, y, color, size}, wall) do
    circle_coords = Pixelwall.Wall.circle_pixels(x, y, size)
    {:noreply, put_many_coords(wall, circle_coords, color)}
  end

  def save_interval do
    600000 # 10 minutes
    # 10000 # 10 seconds
  end

  def handle_info(:periodic_save, wall) do
    Logger.debug("Doing periodic save!")
    Process.send_after(self, :periodic_save, Pixelwall.WallServer.save_interval)
    {:noreply, wall |> Pixelwall.Wall.save |> Pixelwall.Wall.save_pixels}
  end

  def handle_call({:put, x, y, color}, _from, wall) do
    new_wall = wall |> Pixelwall.Wall.put(x, y, color)
    {:reply, new_wall, new_wall}
  end

  def handle_call({:get_row, start_x, end_x, row_number}, _from, wall) do
    row = wall |> Pixelwall.Wall.get_row(start_x, end_x, row_number)
    {:reply, row, wall}
  end

  def handle_call({:put_circle, x, y, color, size}, _from, wall) do
    circle_coords = Pixelwall.Wall.circle_pixels(x, y, size)
    {:reply, :ok, put_many_coords(wall, circle_coords, color)}
  end

  def handle_call({:get, x, y}, _from, wall) do
    {:reply, Pixelwall.Wall.get(wall, x, y), wall}
  end

  def terminate(reason, state) do
    IO.puts("Terminating for reason: #{inspect reason}")
    :ok
  end

end
