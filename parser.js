/*
  Credit goes to Shalvah (https://blog.shalvah.me/).
  This is his algorithm, I just added the ability to parse Logical Operators and Booleans
*/

function Token(type, value) {
   this.type = type;
   this.value = value
}

function isComma(ch) {
	return /,/.test(ch);
}

function isDigit(ch) {
	return /\d/.test(ch);
}

function isLetter(ch) {
	return /[a-z]/i.test(ch);
}

function isOperator(ch) {
	return /\+|-|\*|\/|\^/.test(ch);
}

function isLeftParenthesis(ch) {
	return /\(/.test(ch);
}

function isRightParenthesis(ch) {
	return /\)/.test(ch);
}

function isLogicalOperator(ch) {
    return getLogicalOperator(ch).length > 0;
}

function isBoolean(word) {
	return /true|false/i.test(word);
}

function getLogicalOperator(chars) {
	let match = /&&|\|\||==|!=|>=|>|<=|</.exec(chars);
	return match ? match[0] : ""
}

function tokenize(str) {
	str.replace(/\s+/g, "");
	str=str.split("");

	var result=[];
	var letterBuffer=[];
	var numberBuffer=[];

	str.forEach(function (char, idx, arr) {
		if(isDigit(char)) {
			numberBuffer.push(char);
		} else if(char==".") {
			numberBuffer.push(char);
		} else if (isLetter(char)) {
			if(numberBuffer.length) {
				emptyNumberBufferAsLiteral();
				result.push(new Token("Operator", "*"));
			}
			letterBuffer.push(char);
		} else if (isOperator(char)) {
			emptyNumberBufferAsLiteral();
			emptyLetterBufferAsVariables();
			result.push(new Token("Operator", char));
		} else if (isLeftParenthesis(char)) {
			if(letterBuffer.length) {
				result.push(new Token("Function", letterBuffer.join("")));
				letterBuffer=[];
			} else if(numberBuffer.length) {
				emptyNumberBufferAsLiteral();
				result.push(new Token("Operator", "*"));
			}
			result.push(new Token("Left Parenthesis", char));
		} else if (isRightParenthesis(char)) {
			emptyLetterBufferAsVariables();
			emptyNumberBufferAsLiteral();
			result.push(new Token("Right Parenthesis", char));
		} else if (isComma(char)) {
			emptyNumberBufferAsLiteral();
			emptyLetterBufferAsVariables();
			result.push(new Token("Function Argument Separator", char));
		} else if (isLogicalOperator(char+arr[idx+1])) {
            		emptyNumberBufferAsLiteral();
			emptyLetterBufferAsVariables();
			let match = getLogicalOperator(char+arr[idx+1]);
			result.push(new Token("Logical Operator", match));
			if(match.length > 1) arr.splice(idx+1,1);
        }
	});
	if (numberBuffer.length) {
		emptyNumberBufferAsLiteral();
	}
	if(letterBuffer.length) {
		emptyLetterBufferAsVariables();
	}
	return result;

	function emptyLetterBufferAsVariables() {
        if(isBoolean(letterBuffer.join(''))) {
            result.push(new Token("Boolean", letterBuffer.join('')));
        } else {
    		var l = letterBuffer.length;
    		for (var i = 0; i < l; i++) {
    			result.push(new Token("Variable", letterBuffer[i]));
              if(i< l-1) { //there are more Variables left
              	result.push(new Token("Operator", "*"));
              }  
            }
        }
      letterBuffer = [];
  }

  function emptyNumberBufferAsLiteral() {
  	if(numberBuffer.length) {
  		result.push(new Token("Literal", numberBuffer.join("")));
  		numberBuffer=[];
  	}
  }

}


function parse(inp){
	var outQueue=[];
	var opStack=[];

	Array.prototype.peek = function() {
		return this.slice(-1)[0];
	};

	var assoc = {
		"^" : "right",
		"*" : "left",
		"/" : "left",
		"+" : "left",
		"-" : "left",
		"&&": "left",
		"||": "left",
		"==": "left",
		"!=": "left",
		">": "left",
		">=": "left",
		"<": "left",
		"<=": "left"
	};

	var prec = {
		"^" : 4,
		"*" : 3,
		"/" : 3,
		"+" : 2,
		"-" : 2,
		">" : 1,
		">=": 1,
		"<" : 1,
		"<=": 1,
		"==": 0,
		"!=": 0,
		"&&": -1,
		"||": -1
	};

	Token.prototype.precedence = function() {
		return prec[this.value];
	};
	
	Token.prototype.associativity = function() {
		return assoc[this.value];
	};

	//tokenize
	var tokens=tokenize(inp);

	tokens.forEach(function(v) {
		//If the token is a number, then push it to the output queue
		if(v.type === "Literal" || v.type === "Variable" || v.type === "Boolean" ) {
			outQueue.push(v);
		} 
		//If the token is a function token, then push it onto the stack.
		else if(v.type === "Function") {
			opStack.push(v);
		} //If the token is a function argument separator 
		else if(v.type === "Function Argument Separator") {
			//Until the token at the top of the stack is a left parenthesis
			//pop operators off the stack onto the output queue.
			while(opStack.peek()
				&& opStack.peek().type !== "Left Parenthesis") {
				outQueue.push(opStack.pop());
		}
			/*if(opStack.length == 0){
				console.log("Mismatched parentheses");
				return;
			}*/
		} 
		//If the token is an operator, o1, then:
		else if(v.type == "Operator" || v.type == "Logical Operator") {
			  //while there is an operator token o2, at the top of the operator stack and either
			  while (opStack.peek() && (opStack.peek().type === "Operator" || opStack.peek().type === "Logical Operator") 
				//o1 is left-associative and its precedence is less than or equal to that of o2, or
				&& ((v.associativity() === "left" && v.precedence() <= opStack.peek().precedence())
					//o1 is right associative, and has precedence less than that of o2,
					|| (v.associativity() === "right" && v.precedence() < opStack.peek().precedence()))) {
			  	outQueue.push(opStack.pop());
			}
			//at the end of iteration push o1 onto the operator stack
			opStack.push(v);
		} 
		
		//If the token is a left parenthesis (i.e. "("), then push it onto the stack.
		else if(v.type === "Left Parenthesis") {
			opStack.push(v);
		}
		//If the token is a right parenthesis (i.e. ")"):
		else if(v.type === "Right Parenthesis") {
			//Until the token at the top of the stack is a left parenthesis, pop operators off the stack onto the output queue.
			while(opStack.peek() 
				&& opStack.peek().type !== "Left Parenthesis") {
				outQueue.push(opStack.pop());
		}
			/*if(opStack.length == 0){
				console.log("Unmatched parentheses");
				return;
			}*/
			//Pop the left parenthesis from the stack, but not onto the output queue.
			opStack.pop();

			//If the token at the top of the stack is a function token, pop it onto the output queue.
			if(opStack.peek() && opStack.peek().type === "Function") {
				outQueue.push(opStack.pop());
			}
		}
	});

	return outQueue.concat(opStack.reverse());
}
