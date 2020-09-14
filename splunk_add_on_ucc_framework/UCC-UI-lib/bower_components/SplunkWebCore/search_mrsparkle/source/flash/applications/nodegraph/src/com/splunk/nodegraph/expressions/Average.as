package com.splunk.nodegraph.expressions
{
	
	public class Average extends AbstractExpression
	{
		
		// Constructor
		
		public function Average(...rest)
		{
			super(2, -1);
			
			this.addChildren(rest);
		}
		
		// Protected Methods
		
		protected override function evalChildren(children:Array, o:Object) : *
		{
			var sum:Number = 0;
			for each (var child:AbstractExpression in children)
				sum += Number(child.eval(o));
			return sum / children.length;
		}
		
		protected override function toStringChildren(children:Array) : String
		{
			var str:String = "";
			for each (var child:AbstractExpression in children)
			{
				if (str == "")
					str += child.toString();
				else
					str += ", " + child.toString();
			}
			return "Average(" + str + ")";
		}
		
	}
	
}
