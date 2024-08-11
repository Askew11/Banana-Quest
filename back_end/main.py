from typing import Mapping, Any, Dict, List, Tuple, Optional
import requests
import os
from http_daemon import delay_open_url, serve_pages


class Player:
    def __init__(self) -> None:
        self.id = ''
        self.x = 0
        self.y = 0
        self.name = ''
        self.known = 0

players: Dict[str, Player] = {}
history: List[Player]= []


def find_player(id:str) -> Player:
    if id not in players:
        newPlayer = Player()
        newPlayer.id = id
        players[id] = newPlayer
        return players[id]
    else:
        return players[id]


def make_ajax_page(payload: Mapping[str, Any]) -> Mapping[str, Any]:
    action = payload['action']
    newid = payload['id']
    
    if action == 'click':
        player = find_player(newid)
        player.x = payload['x']
        player.y = payload['y']
        player.name = payload['name']
        history.append(player)
        print(players)
        return{
            "CLICK" : "CLICK HAPPENED"
        }
        
    elif action == 'update':
        player = find_player(newid)
        remaining_history = history[player.known:]
        player.known = len(history)
        updates: List[Tuple[str, int, int,str]] = []
        for i in range(len(remaining_history)):
            player = remaining_history[i]
            updates.append((player.id, player.x, player.y, player.name))
        return {
            "updates": updates
        }
    return{
        "Error" : "error"
    }

def main() -> None:
    # Get set up
    os.chdir(os.path.join(os.path.dirname(__file__), '../front_end'))

    # Serve pages
    port = 8987
    delay_open_url(f'http://localhost:{port}/game.html', .1)
    serve_pages(port, {
        'ajax.html': make_ajax_page,
    })

if __name__ == "__main__":
    main()
