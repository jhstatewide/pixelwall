defmodule Pixelwall.WallServer do
  use GenServer
  require Logger

  def start_link(default) do
    GenServer.start_link(__MODULE__, default)
  end

  def put(pid, x, y, color) do
    GenServer.cast(pid, {:put, x, y, color})
  end

  def put!(pid, x, y, color) do
    GenServer.call(pid, {:put, x, y, color})
  end

  def get(pid, x, y) do
    GenServer.call(pid, {:get, x, y})
  end

  def wall(pid) do
    GenServer.call(pid, :wall)
  end

  def init(args) do
    wall = (Pixelwall.Repo.get_by(Pixelwall.Wall, name: args[:name]) || %Pixelwall.Wall{name: args[:name]})
    |> Pixelwall.Wall.load_pixels
    {:ok, wall}
  end

  def handle_cast({:put, x, y, color}, wall) do
    wall |> Pixelwall.Wall.put(x, y, color)
    {:noreply, wall}
  end

  def handle_info(:periodic_save, wall) do
    Logger.debug("Doing periodic save!")
    Process.send_after(self, :periodic_save, 60000)
    {:noreply, wall |> Pixelwall.Wall.save |> Pixelwall.Wall.save_pixels}
  end

  def handle_call({:put, x, y, color}, _from, wall) do
    new_wall = wall |> Pixelwall.Wall.put(x, y, color)
    {:reply, new_wall, new_wall}
  end

  def handle_call(:wall, _from, wall) do
    {:reply, wall, wall}
  end

  def handle_call({:get, x, y}, _from, wall) do
    {:reply, Pixelwall.Wall.get(wall, x, y), wall}
  end

  def terminate(reason, state) do
    IO.puts("Terminating for reason: #{inspect reason}")
    :ok
  end

end
