document.addEventListener('DOMContentLoaded', () => {
    const itemsList = document.getElementById('itemsList');
    const searchInput = document.getElementById('searchInput');
    const loadingIndicator = document.getElementById('loadingIndicator');
    
    let currentPage = 0;
    let isLoading = false;
    let hasMore = true;
    let currentSearch = '';
    let dragStartIndex;
    
    
    async function loadItems(reset = false) {
      if (isLoading || !hasMore) return;
      
      isLoading = true;
      loadingIndicator.style.display = 'block';
      
      if (reset) {
        itemsList.innerHTML = '';
        currentPage = 0;
        hasMore = true;
      }
      
      const offset = currentPage * 20;
      
      try {
        const response = await fetch(`/api/items?search=${encodeURIComponent(currentSearch)}&offset=${offset}&limit=20`);
        const data = await response.json();
        
        if (data.items.length === 0) {
          hasMore = false;
          if (reset) {
            itemsList.innerHTML = '<li class="list-item">No items found</li>';
          }
        } else {
          renderItems(data.items);
          currentPage++;
        }
      } catch (error) {
        console.error('Error loading items:', error);
      } finally {
        isLoading = false;
        loadingIndicator.style.display = 'none';
      }
    }
    
    
    function renderItems(items) {
      items.forEach(item => {
        const li = document.createElement('li');
        li.className = `list-item ${item.selected ? 'selected' : ''}`;
        li.dataset.id = item.id;
        li.draggable = true;
        
        li.innerHTML = `
          <input type="checkbox" ${item.selected ? 'checked' : ''}>
          <span>${item.value}</span>
        `;
        
        
        const checkbox = li.querySelector('input');
        checkbox.addEventListener('change', () => toggleSelection(item.id, checkbox.checked));
        
        
        li.addEventListener('dragstart', handleDragStart);
        li.addEventListener('dragover', handleDragOver);
        li.addEventListener('drop', handleDrop);
        li.addEventListener('dragend', handleDragEnd);
        
        itemsList.appendChild(li);
      });
    }
    
    
    async function toggleSelection(id, selected) {
      try {
        const response = await fetch('/api/state', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            selectedItems: selected
              ? [...getState().selectedItems, id]
              : getState().selectedItems.filter(itemId => itemId !== id)
          })
        });
        
        if (response.ok) {
          const itemElement = document.querySelector(`.list-item[data-id="${id}"]`);
          if (itemElement) {
            itemElement.classList.toggle('selected', selected);
          }
        }
      } catch (error) {
        console.error('Error updating selection:', error);
      }
    }
    
    
    function handleDragStart(e) {
      dragStartIndex = +this.dataset.id;
      this.classList.add('dragging');
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('text/html', this.innerHTML);
    }
    
    function handleDragOver(e) {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
    }
    
    async function handleDrop(e) {
      e.preventDefault();
      const dragEndIndex = +this.dataset.id;
      
      if (dragStartIndex !== dragEndIndex) {
        const state = getState();
        const newOrder = state.customOrder || Array.from({ length: 1000000 }, (_, i) => i + 1);
        
        const startPos = newOrder.indexOf(dragStartIndex);
        const endPos = newOrder.indexOf(dragEndIndex);
        
        if (startPos !== -1 && endPos !== -1) {
          newOrder.splice(startPos, 1);
          newOrder.splice(endPos, 0, dragStartIndex);
          
          try {
            await fetch('/api/state', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ customOrder: newOrder })
            });
            
            
            currentSearch = searchInput.value;
            loadItems(true);
          } catch (error) {
            console.error('Error updating order:', error);
          }
        }
      }
    }
    
    function handleDragEnd() {
      this.classList.remove('dragging');
    }
    
    
    function getState() {

      return window.appState || { selectedItems: [], customOrder: null };
    }
    
    
    searchInput.addEventListener('input', debounce(() => {
      currentSearch = searchInput.value;
      loadItems(true);
    }, 300));
    
    
    itemsList.parentElement.addEventListener('scroll', () => {
      const { scrollTop, scrollHeight, clientHeight } = itemsList.parentElement;
      if (scrollTop + clientHeight >= scrollHeight - 20) {
        loadItems();
      }
    });
    
    
    function debounce(func, wait) {
      let timeout;
      return function() {
        const context = this, args = arguments;
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(context, args), wait);
      };
    }
    
    
    loadItems();
  });