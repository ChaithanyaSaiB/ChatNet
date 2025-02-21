// document.addEventListener("DOMContentLoaded", function () {
//     const userInput = document.querySelector("#user-input");
//     const defaultHeight = "40px";
//     const maxHeight = "120px";

//     function adjustHeight() {
//         userInput.style.height = defaultHeight;
//         userInput.style.height = Math.min(userInput.scrollHeight, parseInt(maxHeight)) + "px";
//     }

//     userInput.addEventListener("input", adjustHeight);

//     userInput.addEventListener("focus", adjustHeight);

//     userInput.addEventListener("blur", function () {
//         userInput.style.height = defaultHeight;
//     });
// });

// document.addEventListener("DOMContentLoaded", function () {
//     // Select all tree nodes
//     document.querySelectorAll(".node").forEach(node => {
//         node.addEventListener("click", function () {
//             // Remove selection from other nodes
//             // document.querySelectorAll(".node").forEach(n => n.classList.remove("selected"));
//             // Add selection class to clicked node
//             if (this.classList.contains("selected")) {
//                 this.classList.remove("selected");
//             }
//             else {
//                 this.classList.add("selected");
//             }
//         });
//     });
// });

// class TreeNode {
//     constructor(value, x, y) {
//         this.value = value;
//         this.children = [];
//         this.x = x;
//         this.y = y;
//         this.radius = 20;
//         this.selected = false;
//         this.parent = null;
//     }
// }

// class Tree {
//     constructor() {
//         this.root = null;
//         this.nodes = [];
//     }

//     insert(parentValue, newValue) {
//         const newNode = new TreeNode(newValue, 0, 0);

//         if (parentValue === null) {
//             // If there's no root, create one
//             if (!this.root) {
//                 this.root = newNode;
//                 this.nodes.push(newNode);
//                 console.log(`Root node ${newValue} added.`);
//                 return true;
//             } else {
//                 console.warn("Root node already exists!");
//                 return false;
//             }
//         }

//         // Find the parent node
//         const parent = this.findNode(parentValue);
//         if (!parent) {
//             console.error(`Parent node ${parentValue} not found.`);
//             return false;
//         }

//         // Attach the new node to the parent
//         newNode.parent = parent;
//         parent.children.push(newNode);
//         this.nodes.push(newNode);
//         console.log(`Node ${newValue} added as child of ${parentValue}`);

//         adjustCanvasSize();
//         drawTree();
//         return true;
//     }

//     findNode(value) {
//         return this.nodes.find(node => node.value === value);
//     }

//     getWidth() {
//         let minX = Infinity, maxX = -Infinity;
//         this.nodes.forEach(node => {
//             if (node.x < minX) minX = node.x;
//             if (node.x > maxX) maxX = node.x;
//         });
//         return (maxX - minX) + 100; // Add 100px padding to prevent left cut-off
//     }

//     getHeight() {
//         let maxY = -Infinity;
//         this.nodes.forEach(node => {
//             if (node.y > maxY) maxY = node.y;
//         });
//         return maxY + 100; // Extra padding
//     }

//     detectCollisions() {
//         const collisions = [];
//         for (let i = 0; i < this.nodes.length; i++) {
//             for (let j = i + 1; j < this.nodes.length; j++) {
//                 const a = this.nodes[i];
//                 const b = this.nodes[j];
//                 const dx = a.x - b.x;
//                 const dy = a.y - b.y;
//                 const distance = Math.sqrt(dx * dx + dy * dy);
//                 if (distance < (a.radius + b.radius) * 1.3) { // Increased buffer
//                     collisions.push({ node1: a, node2: b });
//                 }
//             }
//         }
//         return collisions;
//     }

//     resolveCollisions(collisions) {
//         collisions.forEach(collision => {
//             const node1 = collision.node1;
//             const node2 = collision.node2;
//             const shift = node1.radius * 2.5;

//             // Determine direction to push apart
//             let dx = node2.x - node1.x;
//             let dy = node2.y - node1.y;

//             // Normalize the direction vector
//             const distance = Math.sqrt(dx * dx + dy * dy);
//             dx /= distance;
//             dy /= distance;

//             // Apply shift
//             node2.x += dx * shift;
//             node2.y += dy * shift;
//             node1.x -= dx * shift;
//             node1.y -= dy * shift;

//             // Recursively reposition parents
//             this.repositionParent(node1, dx * -shift * 0.3); // Reduce shift amount
//             this.repositionParent(node2, dx * shift * 0.3);  // Reduce shift amount
//         });
//     }

//     repositionParent(node, shiftX) {
//         if (!node.parent) return;  // Base case: if no parent, stop recursion

//         node.parent.x += shiftX;

//         // Continue repositioning up the tree
//         this.repositionParent(node.parent, shiftX * 0.3); // Reduced shift for higher levels
//     }
// }

// const canvas = document.getElementById('treeCanvas');
// const ctx = canvas.getContext('2d');
// const tree = new Tree();
// let selection = undefined;

// // Function to calculate positions level by level
// function calculateLevelPositions(root, levelHeight, nodeSpacing) {
//     const levels = {}; // Store nodes by level

//     function traverse(node, level) {
//         if (!node) return;

//         if (!levels[level]) {
//             levels[level] = [];
//         }
//         levels[level].push(node);

//         node.children.forEach(child => traverse(child, level + 1));
//     }

//     traverse(root, 0);

//     // Calculate X positions for each level
//     for (const level in levels) {
//         const nodes = levels[level];
//         const totalWidth = (nodes.length - 1) * nodeSpacing;
//         let startX = canvas.width / 2 - totalWidth / 2;

//         nodes.forEach((node, index) => {
//             node.x = startX + index * nodeSpacing;
//             node.y = parseInt(level) * levelHeight + 50;  // Y position based on level

//             // Check for collisions and adjust position
//             adjustPositionForCollisions(node);
//         });
//     }
// }

// // Function to adjust node position to avoid collisions
// function adjustPositionForCollisions(node) {
//     for (let i = 0; i < tree.nodes.length; i++) {
//         const otherNode = tree.nodes[i];
//         if (node !== otherNode) {
//             const dx = node.x - otherNode.x;
//             const dy = node.y - otherNode.y;
//             const distance = Math.sqrt(dx * dx + dy * dy);

//             if (distance < (node.radius + otherNode.radius) * 1.3) {
//                 // Collision detected: shift the node
//                 node.x += (node.x > otherNode.x) ? 20 : -20;
//             }
//         }
//     }
// }

// function drawTree() {
//     ctx.clearRect(0, 0, canvas.width, canvas.height);
//     const levelHeight = 100;
//     const nodeSpacing = 60;

//     calculateLevelPositions(tree.root, levelHeight, nodeSpacing);

//     // Draw connections and nodes
//     drawNode(tree.root, levelHeight, nodeSpacing);
// }

// function drawNode(node, levelHeight, nodeSpacing) {
//     if (!node) return;

//     // Draw connection lines
//     node.children.forEach(child => {
//         ctx.beginPath();
//         ctx.moveTo(node.x, node.y + node.radius);
//         ctx.lineTo(child.x, child.y - child.radius);
//         ctx.stroke();
//     });

//     // Draw node circle
//     ctx.beginPath();
//     ctx.arc(node.x, node.y, node.radius, 0, 2 * Math.PI);
//     ctx.fillStyle = node.selected ? '#FF6347' : '#BADA55';
//     ctx.fill();
//     ctx.stroke();

//     // Draw node label
//     ctx.fillStyle = 'black';
//     ctx.textAlign = 'center';
//     ctx.textBaseline = 'middle';
//     ctx.fillText(node.value, node.x, node.y);

//     // Recursively draw children
//     node.children.forEach(child => drawNode(child, levelHeight, nodeSpacing));
// }

// function adjustCanvasSize() {
//     const container = document.getElementById('tree-container');
//     const canvas = document.getElementById('treeCanvas');
//     const treeWidth = tree.getWidth();
//     const treeHeight = tree.getHeight();

//     // Set minimum width to container width or tree width, whichever is larger
//     canvas.width = Math.max(treeWidth, container.clientWidth);
//     canvas.height = Math.max(treeHeight, container.clientHeight);

//     // Calculate the left padding to center the tree
//     const leftPadding = Math.max(0, (container.clientWidth - treeWidth) / 2);

//     // Apply left padding to the canvas
//     canvas.style.paddingLeft = `${leftPadding}px`;

//     drawTree();
// }

// // Call this function after adding nodes and on window resize
// window.addEventListener('resize', adjustCanvasSize);

// window.addNode = function(parentValue, newValue) {
//     //const parentValue = document.getElementById('parentValue').value;
//     //const newValue = document.getElementById('newValue').value;

//     if (!newValue) {
//         alert("Please enter a valid node value.");
//         return;
//     }
//     console.log(parentValue);
//     const parentNum = (parentValue && parentValue !== "None") ? parseInt(parentValue) : null;
//     console.log(parentNum);
//     const newNum = parseInt(newValue);

//     if (tree.insert(parentNum, newNum)) {
//         adjustCanvasSize();
//         drawTree();
//     }
// }

// function within(x, y) {
//     return tree.nodes.find(n => {
//         const dx = x - n.x;
//         const dy = y - n.y;
//         return (dx * dx + dy * dy) <= (n.radius * n.radius);
//     });
// }

// function down(e) {
//     const rect = canvas.getBoundingClientRect();
//     console.log("canvas rect",rect);
//     const x = e.clientX - rect.left;
//     const y = e.clientY - rect.top;
//     console.log("click coordinates",x, y);
//     let target = within(x, y);
//     if (target) {
//         if (selection) selection.selected = false;
//         selection = target;
//         selection.selected = true;
//         drawTree();
//     }
// }

// function up(e) {
//     // We don't need to deselect on mouseup for this implementation
// }

// canvas.addEventListener('mousedown', down);
// canvas.addEventListener('mouseup', up);






















































class TreeNode {
    constructor(value, x, y) {
        this.value = value;
        this.children = [];
        this.x = x;
        this.y = y;
        this.radius = 20;
        this.selected = false;
        this.parent = null;
    }
}

class Tree {
    constructor() {
        this.root = null;
        this.nodes = [];
    }

    insert(parentValue, newValue) {
        const newNode = new TreeNode(newValue, 0, 0);

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
        return maxY + 100; // Extra padding
    }

    detectCollisions() {
        const collisions = [];
        for (let i = 0; i < this.nodes.length; i++) {
            for (let j = i + 1; j < this.nodes.length; j++) {
                const a = this.nodes[i];
                const b = this.nodes[j];
                const dx = a.x - b.x;
                const dy = a.y - b.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                if (distance < (a.radius + b.radius) * 1.3) { // Increased buffer
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
            const shift = node1.radius * 2.5;

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

            // Recursively reposition parents
            this.repositionParent(node1, dx * -shift * 0.3); // Reduce shift amount
            this.repositionParent(node2, dx * shift * 0.3);  // Reduce shift amount
        });
    }

    repositionParent(node, shiftX) {
        if (!node.parent) return;  // Base case: if no parent, stop recursion

        node.parent.x += shiftX;

        // Continue repositioning up the tree
        this.repositionParent(node.parent, shiftX * 0.3); // Reduced shift for higher levels
    }
}

const canvas = document.getElementById('treeCanvas');
const ctx = canvas.getContext('2d');
window.tree = new Tree();
let selection = undefined;

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
            console.log("calculateLevelPositions: Node", node.value, "x:", node.x, "y:", node.y); //ADDED
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
    const nodeSpacing = 60;

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
        ctx.lineTo(child.x, child.y - child.radius);
        ctx.stroke();
    });

    // Draw node circle
    ctx.beginPath();
    ctx.arc(node.x, node.y, node.radius, 0, 2 * Math.PI);
    ctx.fillStyle = node.selected ? '#FF6347' : '#BADA55';
    ctx.fill();
    ctx.stroke();

    // Draw node label
    ctx.fillStyle = 'black';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(node.value, node.x, node.y);

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
    const leftPadding = Math.max(0, (container.clientWidth - treeWidth) / 2);

    // Apply left padding to the canvas
    //canvas.style.paddingLeft = `${leftPadding}px`;

    drawTree();
}

// Call this function after adding nodes and on window resize
window.addEventListener('resize', adjustCanvasSize);

window.addNode = function(parentValue, newValue) {
    if (!newValue) {
        alert("Please enter a valid node value.");
        return;
    }
    console.log(parentValue);
    const parentNum = (parentValue && parentValue !== "None") ? parseInt(parentValue) : null;
    console.log(parentNum);
    const newNum = parseInt(newValue);

    if (window.tree.insert(parentNum, newNum)) {
        adjustCanvasSize();
        drawTree();

        // Select the new node:

        console.log("newNum's type is",typeof newNum);
        const newNode = window.tree.findNode(newNum); // Find the newly added node
        if (selection) {
            selection.selected = false; // Deselect the previous selection
        }
        selection = newNode;              // Select the new node
        if (selection) selection.selected = true;
        drawTree();                        // Redraw to highlight the selection
    }
}

window.buildTreeAndSelectNode = function(conversation, queryId) {
    if (conversation.length !== 0) {
        conversation.forEach(conversation_unit => {
            window.addNode(conversation_unit.parent_query_id, conversation_unit.child_query_id);
        });
        window.selectNode(queryId);
        drawTree(); // Find the newly added node
    }
}

window.selectNode = function(value) {
    console.log("value at the start of selectNode",value);
    console.log("type of value is",typeof value);
    const foundNode = window.tree.findNode(parseInt(value,10)); // Find the newly added node
    console.log("value of found node is",foundNode.value);
    console.log("selection's selected value is",selection.selected);
    if (selection) {
        selection.selected = false; // Deselect the previous selection
    }
    selection = foundNode;              // Select the new node
    if (selection) selection.selected = true;
}


function within(x, y) {
    const foundNode = window.tree.nodes.find(n => {
        const dx = x - n.x;
        const dy = y - n.y;
        const isWithin = (dx * dx + dy * dy) <= (n.radius * n.radius);
        console.log("Node:", n.value, "dx:", dx, "dy:", dy, "isWithin:", isWithin); // ADDED
        return isWithin;
    });
    return foundNode;
}


function down(e) {
    const rect = canvas.getBoundingClientRect();
    const offsetX = canvas.offsetLeft;  // Or a fixed offset value if needed
    const offsetY = canvas.offsetTop;  // Or a fixed offset value if needed
    const x = e.clientX - rect.left - offsetX;
    const y = e.clientY - rect.top - offsetY;
    console.log("Click coordinates:", x, y);
    let target = within(x, y);
    if (target) {
        console.log("Node found:", target.value);
        if (selection) {
            selection.selected = false;
            console.log("Deselected:", selection.value);
        }
        selection = target;
        selection.selected = true;
        console.log("Selected:", selection.value);
        selectedNodeChanged(selection.value);
        drawTree();
    } else {
        console.log("No node found at click coordinates");
    }
}




function up(e) {
    // We don't need to deselect on mouseup for this implementation
}

canvas.addEventListener('mousedown', down);
canvas.addEventListener('mouseup', up);













































// document.addEventListener("DOMContentLoaded", function () {
//     const userInput = document.querySelector("#user-input");
//     const defaultHeight = "40px";
//     const maxHeight = "120px";

//     function adjustHeight() {
//         userInput.style.height = defaultHeight;
//         userInput.style.height = Math.min(userInput.scrollHeight, parseInt(maxHeight)) + "px";
//     }

//     userInput.addEventListener("input", adjustHeight);

//     userInput.addEventListener("focus", adjustHeight);

//     userInput.addEventListener("blur", function () {
//         userInput.style.height = defaultHeight;
//     });
// });

// document.addEventListener("DOMContentLoaded", function () {
//     // Select all tree nodes
//     document.querySelectorAll(".node").forEach(node => {
//         node.addEventListener("click", function () {
//             // Remove selection from other nodes
//             // document.querySelectorAll(".node").forEach(n => n.classList.remove("selected"));
//             // Add selection class to clicked node
//             if (this.classList.contains("selected")) {
//                 this.classList.remove("selected");
//             }
//             else {
//                 this.classList.add("selected");
//             }
//         });
//     });
// });

// class TreeNode {
//     constructor(value, x, y) {
//         this.value = value;
//         this.children = [];
//         this.parents = [];  // Modified to support multiple parents
//         this.x = x;
//         this.y = y;
//         this.radius = 20;
//         this.selected = false;
//     }
// }

// class Tree {
//     constructor() {
//         this.root = null;
//         this.nodes = [];
//     }

//     insert(parentValues, newValue) {
//         let newNode = this.findNode(newValue);
    
//         // If the node doesn't exist, create a new one
//         if (!newNode) {
//             newNode = new TreeNode(newValue, 0, 0);
//             this.nodes.push(newNode);
//         }
    
//         // If no parent values are provided, treat it as the root
//         if (!parentValues || parentValues.trim() === "") {
//             if (!this.root) {
//                 this.root = newNode;
//                 console.log(`Root node ${newValue} added.`);
//             } else {
//                 console.warn("Root node already exists!");
//                 return false;
//             }
//         } else {
//             // Handle multiple parents
//             parentValues.split(",").forEach(parentValue => {
//                 let parent = this.findNode(parentValue.trim());
//                 if (!parent) {
//                     console.error(`Parent node ${parentValue} not found.`);
//                     return;
//                 }
    
//                 // Avoid duplicate parent-child relationships
//                 if (!newNode.parents.includes(parent)) {
//                     newNode.parents.push(parent);
//                     parent.children.push(newNode);
//                 }
//             });
//         }
    
//         adjustCanvasSize();
//         drawTree();
//         return true;
//     }
    
    

//     findNode(value) {
//         return this.nodes.find(node => node.value === value);
//     }

//     getWidth() {
//         let minX = Infinity, maxX = -Infinity;
//         this.nodes.forEach(node => {
//             if (node.x < minX) minX = node.x;
//             if (node.x > maxX) maxX = node.x;
//         });
//         return (maxX - minX) + 100; // Add 100px padding to prevent left cut-off
//     }

//     getHeight() {
//         let maxY = -Infinity;
//         this.nodes.forEach(node => {
//             if (node.y > maxY) maxY = node.y;
//         });
//         return maxY + 100; // Extra padding
//     }

//     detectCollisions() {
//         const collisions = [];
//         for (let i = 0; i < this.nodes.length; i++) {
//             for (let j = i + 1; j < this.nodes.length; j++) {
//                 const a = this.nodes[i];
//                 const b = this.nodes[j];
//                 const dx = a.x - b.x;
//                 const dy = a.y - b.y;
//                 const distance = Math.sqrt(dx * dx + dy * dy);
//                 if (distance < (a.radius + b.radius) * 1.3) { // Increased buffer
//                     collisions.push({ node1: a, node2: b });
//                 }
//             }
//         }
//         return collisions;
//     }

//     resolveCollisions(collisions) {
//         collisions.forEach(collision => {
//             const node1 = collision.node1;
//             const node2 = collision.node2;
//             const shift = node1.radius * 2.5;

//             // Determine direction to push apart
//             let dx = node2.x - node1.x;
//             let dy = node2.y - node1.y;

//             // Normalize the direction vector
//             const distance = Math.sqrt(dx * dx + dy * dy);
//             dx /= distance;
//             dy /= distance;

//             // Apply shift
//             node2.x += dx * shift;
//             node2.y += dy * shift;
//             node1.x -= dx * shift;
//             node1.y -= dy * shift;

//             // Recursively reposition parents
//             this.repositionParent(node1, dx * -shift * 0.3); // Reduce shift amount
//             this.repositionParent(node2, dx * shift * 0.3);  // Reduce shift amount
//         });
//     }

//     repositionParent(node, shiftX) {
//         if (!node.parent) return;  // Base case: if no parent, stop recursion

//         node.parent.x += shiftX;

//         // Continue repositioning up the tree
//         this.repositionParent(node.parent, shiftX * 0.3); // Reduced shift for higher levels
//     }
// }

// const canvas = document.getElementById('treeCanvas');
// const ctx = canvas.getContext('2d');
// const tree = new Tree();
// let selection = undefined;

// // Function to calculate positions level by level
// function calculateLevelPositions(root, levelHeight, nodeSpacing) {
//     const levels = {}; // Store nodes by level

//     function traverse(node, level) {
//         if (!node) return;

//         if (!levels[level]) {
//             levels[level] = [];
//         }
//         levels[level].push(node);

//         node.children.forEach(child => traverse(child, level + 1));
//     }

//     traverse(root, 0);

//     // Calculate X positions for each level
//     for (const level in levels) {
//         const nodes = levels[level];
//         const totalWidth = (nodes.length - 1) * nodeSpacing;
//         let startX = canvas.width / 2 - totalWidth / 2;

//         nodes.forEach((node, index) => {
//             node.x = startX + index * nodeSpacing;
//             node.y = parseInt(level) * levelHeight + 50;  // Y position based on level

//             // Check for collisions and adjust position
//             adjustPositionForCollisions(node);
//         });
//     }
// }

// function adjustPositionForCollisions(node) {
//     for (let i = 0; i < tree.nodes.length; i++) {
//         const otherNode = tree.nodes[i];
//         if (node !== otherNode) {
//             let dx = node.x - otherNode.x;
//             let dy = node.y - otherNode.y;
//             let distance = Math.sqrt(dx * dx + dy * dy);

//             if (distance < (node.radius + otherNode.radius) * 1.5) {
//                 let angle = Math.atan2(dy, dx);
//                 node.x += Math.cos(angle) * 30;
//                 node.y += Math.sin(angle) * 30;
//             }
//         }
//     }
// }


// function drawTree() {
//     ctx.clearRect(0, 0, canvas.width, canvas.height);
//     const levelHeight = 100;
//     const nodeSpacing = 60;

//     calculateLevelPositions(tree.root, levelHeight, nodeSpacing);

//     // Draw connections and nodes
//     drawNode(tree.root, levelHeight, nodeSpacing);
// }

// function drawNode(node, levelHeight, nodeSpacing) {
//     if (!node) return;

//     // Draw connection lines
//     node.children.forEach(child => {
//         ctx.beginPath();
//         ctx.moveTo(node.x, node.y + node.radius);
//         ctx.lineTo(child.x, child.y - child.radius);
//         ctx.stroke();
//     });

//     // Draw node circle
//     ctx.beginPath();
//     ctx.arc(node.x, node.y, node.radius, 0, 2 * Math.PI);
//     ctx.fillStyle = node.selected ? '#FF6347' : '#BADA55';
//     ctx.fill();
//     ctx.stroke();

//     // Draw node label
//     ctx.fillStyle = 'black';
//     ctx.textAlign = 'center';
//     ctx.textBaseline = 'middle';
//     ctx.fillText(node.value, node.x, node.y);

//     // Recursively draw children
//     node.children.forEach(child => drawNode(child, levelHeight, nodeSpacing));
// }

// function adjustCanvasSize() {
//     const container = document.getElementById('tree-container');
//     const canvas = document.getElementById('treeCanvas');

//     // Get tree dimensions
//     const treeWidth = tree.getWidth();
//     const treeHeight = tree.getHeight();

//     // Ensure the canvas is at least as wide as the container
//     canvas.width = Math.max(treeWidth, container.clientWidth);
//     canvas.height = Math.max(treeHeight, container.clientHeight);

//     // Calculate the left padding to center the tree properly
//     const minX = Math.min(...tree.nodes.map(node => node.x));
//     const maxX = Math.max(...tree.nodes.map(node => node.x));
//     const treeCenterX = (minX + maxX) / 2;
    
//     // Adjust canvas left offset to keep everything visible
//     const offsetX = Math.max(0, container.clientWidth / 2 - treeCenterX);
//     canvas.style.marginLeft = `${offsetX}px`;

//     drawTree();
// }


// // Call this function after adding nodes and on window resize
// window.addEventListener('resize', adjustCanvasSize);

// function addNode() {
//     const parentValues = document.getElementById('parentValues').value.trim();
//     const newValue = document.getElementById('newValue').value.trim();

//     if (!newValue) {
//         alert("Please enter a valid node value.");
//         return;
//     }

//     if (tree.insert(parentValues, newValue)) {
//         adjustCanvasSize();
//         drawTree();
//     }
// }


// function within(x, y) {
//     return tree.nodes.find(n => {
//         const dx = x - n.x;
//         const dy = y - n.y;
//         return (dx * dx + dy * dy) <= (n.radius * n.radius);
//     });
// }

// function down(e) {
//     const rect = canvas.getBoundingClientRect();
//     const x = e.clientX - rect.left;
//     const y = e.clientY - rect.top;
//     let target = within(x, y);
//     if (target) {
//         if (selection) selection.selected = false;
//         selection = target;
//         selection.selected = true;
//         drawTree();
//     }
// }

// function up(e) {
//     // We don't need to deselect on mouseup for this implementation
// }

// canvas.addEventListener('mousedown', down);
// canvas.addEventListener('mouseup', up);