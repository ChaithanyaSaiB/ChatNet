class TreeNode {
    constructor(value, x, y, merged_status, queryText = "", aiResponse = "") {
        this.value = value;
        this.children = [];
        this.x = x;
        this.y = y;
        this.queryText = queryText;
        this.aiResponse = aiResponse;
        this.width = 100;  // Width of the rectangle
        this.height = 40; // Height of the rectangle
        this.radius = this.height / 2; //radius will be half height
        this.selected = false;
        this.parent = null;
        this.merged = merged_status;
    }
}

function truncateString(str, maxLength = 15) {
    if (str.length > maxLength) {
      return str.slice(0, maxLength) + '...';
    }
    return str;
}

class Tree {
    constructor() {
        this.root = null;
        this.nodes = [];
    }

    insert(parentValue, newValue, merged_status, queryText, aiResponse) {
        const newNode = new TreeNode(newValue, 0, 0, merged_status, queryText, aiResponse);

        if (parentValue === null) {
            // If there's no root, create one
            if (!this.root) {
                this.root = newNode;
                this.nodes.push(newNode);
                console.log(`Root node ${newValue} added.`);
                return true;
            } else {
                console.warn("Root node already exists!");
                return false;
            }
        }

        // Find the parent node
        const parent = this.findNode(parentValue);
        if (!parent) {
            console.error(`Parent node ${parentValue} not found.`);
            return false;
        }

        // Attach the new node to the parent
        newNode.parent = parent;
        parent.children.push(newNode);
        this.nodes.push(newNode);
        console.log(`Node ${newValue} added as child of ${parentValue}`);

        adjustCanvasSize();
        drawTree();
        return true;
    }

    findNode(value) {
        return this.nodes.find(node => node.value === value);
    }

    getWidth() {
        let minX = Infinity, maxX = -Infinity;
        this.nodes.forEach(node => {
            if (node.x < minX) minX = node.x;
            if (node.x > maxX) maxX = node.x;
        });
        return (maxX - minX) + 100; // Add 100px padding to prevent left cut-off
    }

    getHeight() {
        let maxY = -Infinity;
        this.nodes.forEach(node => {
            if (node.y > maxY) maxY = node.y;
        });
        return maxY; // Extra padding
    }

    detectCollisions() {
        const collisions = [];
        for (let i = 0; i < this.nodes.length; i++) {
            for (let j = i + 1; j < this.nodes.length; j++) {
                const a = this.nodes[i];
                const b = this.nodes[j];
                const dx = a.x - b.x;
                const dy = a.y - b.y;
    
                // Use rectangular collision detection
                if (Math.abs(dx) < (a.width + b.width) / 2 * 1.3 && Math.abs(dy) < (a.height + b.height) / 2 * 1.3) {
                    collisions.push({ node1: a, node2: b });
                }
            }
        }
        return collisions;
    }    

    resolveCollisions(collisions) {
        collisions.forEach(collision => {
            const node1 = collision.node1;
            const node2 = collision.node2;
            const shift = node1.radius * 3; // Increase the shift amount significantly

            // Determine direction to push apart
            let dx = node2.x - node1.x;
            let dy = node2.y - node1.y;

            // Normalize the direction vector
            const distance = Math.sqrt(dx * dx + dy * dy);
            dx /= distance;
            dy /= distance;

            // Apply shift
            node2.x += dx * shift;
            node2.y += dy * shift;
            node1.x -= dx * shift;
            node1.y -= dx * shift;

            // Recursively reposition parents - reduce shift for higher levels
            this.repositionParent(node1, dx * -shift * 0.2); // Further reduced shift
            this.repositionParent(node2, dx * shift * 0.2);  // Further reduced shift
        });
    }   

    repositionParent(node, shiftX) {
        if (!node.parent) return;  // Base case: if no parent, stop recursion

        node.parent.x += shiftX;

        // Continue repositioning up the tree
        this.repositionParent(node.parent, shiftX * 0.1); // Reduced shift for higher levels
    }

    adjustPositions() {
        if (this.root) {
            //calculateLevelPositions(this.root, levelHeight, nodeSpacing);
            let collisions = this.detectCollisions();
            this.resolveCollisions(collisions);
        }
    }
}

const canvas = document.getElementById('treeCanvas');
const ctx = canvas.getContext('2d');
window.tree = new Tree();
let selection = [];

// Function to calculate positions level by level
function calculateLevelPositions(root, levelHeight, nodeSpacing) {
    const levels = {}; // Store nodes by level

    function traverse(node, level) {
        if (!node) return;

        if (!levels[level]) {
            levels[level] = [];
        }
        levels[level].push(node);

        node.children.forEach(child => traverse(child, level + 1));
    }

    traverse(root, 0);

    // Calculate X positions for each level
    for (const level in levels) {
        const nodes = levels[level];
        const totalWidth = (nodes.length - 1) * nodeSpacing;
        let startX = canvas.width / 2 - totalWidth / 2;

        nodes.forEach((node, index) => {
            node.x = startX + index * nodeSpacing;
            node.y = parseInt(level) * levelHeight + 50;  // Y position based on level
            // Check for collisions and adjust position
            adjustPositionForCollisions(node);
        });
    }
}

// Function to adjust node position to avoid collisions
function adjustPositionForCollisions(node) {
    for (let i = 0; i < window.tree.nodes.length; i++) {
        const otherNode = window.tree.nodes[i];
        if (node !== otherNode) {
            const dx = node.x - otherNode.x;
            const dy = node.y - otherNode.y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance < (node.radius + otherNode.radius) * 1.3) {
                // Collision detected: shift the node
                node.x += (node.x > otherNode.x) ? 20 : -20;
            }
        }
    }
}

function drawTree() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const levelHeight = 100;
    const nodeSpacing = 120;

    calculateLevelPositions(window.tree.root, levelHeight, nodeSpacing);

    // Draw connections and nodes
    drawNode(window.tree.root, levelHeight, nodeSpacing);
}

function drawNode(node, levelHeight, nodeSpacing) {
    if (!node) return;

    // Draw connection lines
    node.children.forEach(child => {
        ctx.beginPath();
        ctx.moveTo(node.x, node.y + node.radius);

        if (child.merged) {
            ctx.setLineDash([5, 5]); // Set a dashed line pattern
        } else {
            ctx.setLineDash([]); // Set a solid line
        }

        ctx.lineTo(child.x, child.y - child.radius);
        ctx.stroke();
    });

    // Draw node rectangle
    ctx.beginPath();
    ctx.rect(node.x - node.width / 2, node.y - node.height / 2, node.width, node.height);
    ctx.setLineDash([]); // Set a solid line
    ctx.fillStyle = node.selected ? (selection.indexOf(node) === 0 ? '#35445c' : '#FF6347') : '#BADA55';
    ctx.fill();
    ctx.stroke();

    // Draw text lines
    ctx.fillStyle = 'black';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(node.queryText, node.x, node.y - 10); // Adjust vertical position for the first line
    ctx.fillText(node.aiResponse, node.x, node.y + 10); // Adjust vertical position for the second line

    // Recursively draw children
    node.children.forEach(child => drawNode(child, levelHeight, nodeSpacing));
}

function adjustCanvasSize() {
    const container = document.getElementById('tree-container');
    const canvas = document.getElementById('treeCanvas');
    const treeWidth = window.tree.getWidth();
    const treeHeight = window.tree.getHeight();

    // Set minimum width to container width or tree width, whichever is larger
    canvas.width = Math.max(treeWidth, container.clientWidth);
    canvas.height = Math.max(treeHeight, container.clientHeight);

    // Calculate the left padding to center the tree
    //const leftPadding = Math.max(0, (container.clientWidth - treeWidth) / 2);

    // Apply left padding to the canvas
    //canvas.style.paddingLeft = `${leftPadding}px`;

    drawTree();
}

// Call this function after adding nodes and on window resize
window.addEventListener('resize', adjustCanvasSize);

window.addNode = function(parentValue, newValue, merged_status, textLine1, textLine2) {
    if (!newValue) {
        alert("Please enter a valid node value.");
        return;
    }
    const parentNum = (parentValue && parentValue !== "None") ? parseInt(parentValue) : null;
    const newNum = parseInt(newValue);

    if (window.tree.insert(parentNum, newNum, merged_status, textLine1, textLine2)) {
        adjustCanvasSize();
        window.selectNode(newNum);
        drawTree();
    }
}

window.buildTreeAndSelectNode = function(conversation, queryId) {
    if (conversation.length !== 0) {
        conversation.forEach(conversation_unit => {
            // Assuming you have a way to derive textLine1 and textLine2 from the conversation unit
            const queryText = truncateString(conversation_unit.query_text) || "";  // Example: from conversation data
            const aiResponse = truncateString(conversation_unit.ai_response) || "";  // Example: from conversation data
            if (conversation_unit.parent_query_ids.length == 1)
                {
                    window.addNode(conversation_unit.parent_query_ids[0], conversation_unit.child_query_id, false, queryText, aiResponse);
                }
                else
                {
                    window.addNode(conversation_unit.parent_query_ids[0], conversation_unit.child_query_id, true, queryText, aiResponse);
                }
        });
        if (queryId.length === 1) {
            window.selectNode(queryId[0]);
        } 
        else if (queryId.length > 1) {
            window.selectNode(queryId[0]);
            
            const restOfIds = queryId.slice(1);
            restOfIds.forEach(id => {
                multiSelectionNodes(id, false);
            });
        }
        else console.log("No query ID provided.");

        drawTree(); // Find the newly added node
        window.tree.adjustPositions();
    }
}

window.selectNode = function(value) {
    const foundNode = window.tree.findNode(parseInt(value,10));
    // if (selection) {
    //     selection.selected = false; // Deselect the previous selection
    // }
    // selection = foundNode;              // Select the new node
    // if (selection) selection.selected = true;
    selection.forEach(node => {
        node.selected = false;
        //console.log("Deselected:", node.value);
    });
    selection = [foundNode];
    foundNode.selected = true;
    //console.log("Selected:", foundNode.value);
}


function within(x, y) {
    const foundNode = window.tree.nodes.find(n => {
        const dx = x - n.x;
        const dy = y - n.y;
        const halfWidth = n.width / 2;
        const halfHeight = n.height / 2;
        const isWithin = Math.abs(dx) <= halfWidth && Math.abs(dy) <= halfHeight;
        console.log("Node:", n.value, "dx:", dx, "dy:", dy, "isWithin:", isWithin); // ADDED
        return isWithin;
    });
    return foundNode;
}


function multiSelectionNodes(value, treeInteraction) {
    const target = window.tree.findNode(parseInt(value,10));
    const index = selection.indexOf(target);
    if (index === -1) {
        selection.push(target);
        target.selected = true;
        if(treeInteraction) multipleSelectionChanged(target.value);
        console.log("Added to selection:", target.value);
    }
    else if (index == 0) alert("Cannot unselected main merge node!");
    else {
        selection.splice(index, 1);
        target.selected = false;
        if(treeInteraction) multipleSelectionChanged(target.value);
        console.log("Removed from selection:", target.value);
    }
    drawTree();
}

function down(e) {
    const rect = canvas.getBoundingClientRect();
    const offsetX = canvas.offsetLeft;  // Or a fixed offset value if needed
    const offsetY = canvas.offsetTop;  // Or a fixed offset value if needed
    const x = e.clientX - rect.left - offsetX;
    const y = e.clientY - rect.top - offsetY;
    let target = within(x, y);
    if (target) {
        console.log("Node found:", target.value);
        if(e.ctrlKey) 
        {
            //alert("ctrl + click!");
            multiSelectionNodes(target.value, true);         
        }
        else
        {
            window.selectNode(target.value);
            selectedNodeChanged(target.value);
            drawTree();
        }
        console.log("selection list is",selection);
    } else {
        console.log("No node found at click coordinates");
    }
}




function up(e) {
    // We don't need to deselect on mouseup for this implementation
}

canvas.addEventListener('mousedown', down);
canvas.addEventListener('mouseup', up);