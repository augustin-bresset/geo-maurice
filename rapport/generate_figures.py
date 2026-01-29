import matplotlib.pyplot as plt
import numpy as np
import heapq

def generate_wavefront_figure():
    """Generates a heatmap showing Dijkstra propagation on a grid with roads."""
    size = 100
    center_x, center_y = 10, 50 # Start on the left
    grid = np.full((size, size), np.inf)
    
    # Priority Queue for Dijkstra
    pq = [(0, center_y, center_x)]
    grid[center_y, center_x] = 0
    
    # Background: High friction (e.g., tough terrain)
    friction = np.full((size, size), 5.0)
    
    # Create "Roads" (Low friction = 1.0)
    # Main horizontal road
    friction[48:53, :] = 1.0 
    
    # Vertical road intersecting
    friction[:, 70:75] = 1.0
    
    # Some secondary roads
    friction[20:23, 20:80] = 1.0
    friction[75:78, 40:90] = 1.0
    
    # Connecting secondary to main
    friction[20:50, 40:43] = 1.0
    
    while pq:
        d, r, c = heapq.heappop(pq)
        
        if d > grid[r, c]:
            continue
            
        for dr, dc in [(-1,0), (1,0), (0,-1), (0,1)]:
            nr, nc = r + dr, c + dc
            if 0 <= nr < size and 0 <= nc < size:
                cost = 1.0 * friction[nr, nc]
                new_dist = d + cost
                if new_dist < grid[nr, nc]:
                    grid[nr, nc] = new_dist
                    heapq.heappush(pq, (new_dist, nr, nc))

    # Plot
    plt.figure(figsize=(8, 6))
    plt.imshow(grid, cmap='magma_r', interpolation='nearest', vmax=150)
    plt.colorbar(label='Coût accumulé (Temps/Distance)')
    plt.title("Propagation : Impact du Réseau Routier")
    
    # Overlay roads for clarity (optional, but helps visualization)
    # We can just rely on the heatmap shape to show it follows roads
    
    plt.scatter([center_x], [center_y], c='cyan', s=100, marker='*', label='Source', edgecolors='black')
    
    plt.text(80, 45, "Autoroute\n(Rapide)", color='white', ha='center', va='center', fontsize=8, fontweight='bold')
    plt.text(50, 10, "Terrain Difficile\n(Lent)", color='black', ha='center', va='center', fontsize=8)
    
    plt.legend(loc='upper right')
    plt.axis('off')
    
    plt.tight_layout()
    plt.savefig('images/fig_propagation.png', dpi=300, bbox_inches='tight')
    plt.close()

def generate_decay_functions_figure():
    """Generates a comparison of decay functions."""
    d = np.linspace(0, 10, 200)
    R = 5 # Range
    
    # Functions
    linear = np.maximum(0, 1 - d/R)
    exponential = np.exp(-d/R)
    constant = np.where(d < R, 1.0, 0.0)
    
    plt.figure(figsize=(8, 4))
    plt.plot(d, linear, label=r'Linéaire : $1 - d/R$', linewidth=2)
    plt.plot(d, exponential, label=r'Exponentielle : $e^{-d/R}$', linewidth=2)
    plt.plot(d, constant, label=r'Constante : $1$ si $d < R$', linewidth=2, linestyle='--')
    
    plt.axvline(x=R, color='gray', linestyle=':', label=r'Portée Max ($R=5$)')
    plt.title("Comparaison des Fonctions de Score")
    plt.xlabel("Distance au service (units)")
    plt.ylabel("Score d'Accessibilité (0-1)")
    plt.legend()
    plt.grid(True, alpha=0.3)
    
    plt.tight_layout()
    plt.savefig('images/fig_functions.png', dpi=300)
    plt.close()

if __name__ == "__main__":
    print("Generating figures...")
    generate_wavefront_figure()
    print("Generated fig_propagation.png")
    generate_decay_functions_figure()
    print("Generated fig_functions.png")
