class CompilerContext {
    constructor(context) {
        this.context = context || [];
        this.indent = "";
    }
    
    emit(text) {
        this.context.push(this.indent + text);
    }
    
    increaseIndent() {
        this.indent += "    ";
    }
    
    decreaseIndent() {
        this.indent -= "   ";
    }
}

class ASTNode {
    constructor(children) {
        this.children = children || [];
    }
    
    push(child) {
        this.children.push(child);
    }
    
    render(indent = 0) {
        let output = "";
        
        let i = indent;
        while (i--) output += "  ";
        
        output += "- " + this.constructor.name + "\n";
        this.children.map((c) => {
            output += c.render(indent + 1);
        });
        
        return output;
    }
    
    compile(context) {
        throw "Unimplemented compile method!";
    }
    
    compile_children(context) {
        this.children.map((c) => c.compile(context));
    }
};

class ProgramNode extends ASTNode {
    compile(context) {
        context.emit("let mem = new Array(999);");
        context.emit("for (let i = 0; i < mem.length; i++) { mem[i] = 0; }");
        context.emit("let mem_ptr = 0;");
        context.emit("");
        
        this.compile_children(context);
    }
};
class IncNode extends ASTNode {
    compile(context) {
        context.emit("mem[mem_ptr]++;");
    }
};
class DecNode extends ASTNode {
    compile(context) {
        context.emit("mem[mem_ptr]--;");
    }
};
class LeftShiftNode extends ASTNode {
    compile(context) {
        context.emit("mem_ptr--;");
    }
};
class RightShiftNode extends ASTNode {
    compile(context) {
        context.emit("mem_ptr++;");
    }
};

// helper nodes, not actually used in the AST
class OpeningLoopNode {};
class ClosingLoopNode {};


class LoopNode extends ASTNode {
    compile(context) {
        context.emit("while (mem[mem_ptr] !== 0) {");
        context.increaseIndent();
        this.compile_children(context);
        context.decreaseIndent();
        context.emit("}");
    }
};

class Parser {
    parseNode(code) {
        switch (code) {
            case "+": return new IncNode();
            case "-": return new DevNode();
            case ">": return new RightShiftNode();
            case "<": return new LeftShiftNode();
            case "[": return new OpeningLoopNode();
            case "]": return new ClosingLoopNode();
        }
    }
    
    buildTree(parentNode, code, index) {
        for (let i = index; i < code.length; i++) {   
            let node = this.parseNode(code[i]);
            let nodeType = node.constructor.name;
            
            // 3 cases, openingloop, closingloop and defaultnodes
            if (nodeType === "OpeningLoopNode") {
                const loopNode = new LoopNode();
                parentNode.push(loopNode);
                i = this.buildTree(loopNode, code, i + 1);
            } 
            else if (nodeType === "ClosingLoopNode") {
                // if closingLoop check if parentNode is actually connected to this loop
                if (parentNode.constructor.name === "LoopNode") {
                    return i;
                }
                else {
                    throw "Unexpected ] bracket";
                }
            }
            else {
                parentNode.push(node);
            }
        }
    }
    
    parseFile(code) {
        const program = new ProgramNode();
        this.buildTree(program, code, 0);
        return program;
    }
}


const code = "++++>[[+++]]>++++";
const parser = new Parser();
const context = new CompilerContext();
let tree = parser.parseFile(code);
tree.compile(context);
console.log(context.context)

