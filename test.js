/* 1. Integration Tests */

/* 1.1 Test Deterministic Functionality */

function test_self_evaluating() {
	parse_and_eval("4;");
	assert_equal(4, final_result);
}

function test_assignment() {
	parse_and_eval("const a = 23; a;");
	assert_equal(23, final_result);
}

function test_conditional_expressions() {
	parse_and_eval("100 % 2 === 0 ? true: false;");
	assert_equal(true, final_result);

	parse_and_eval("100 % 2 !== 0 ? true: false;");
	assert_equal(false, final_result);
}

function test_function() {
	parse_and_eval("const f = () => (x, y) => x + y; f()(12, 13);");
	assert_equal(25, final_result);
}

function test_subfunction() {
	parse_and_eval("function f(x) { function g(y) { return y * 2; } return x * g(10); } f(6);");
	assert_equal(120, final_result);
}

/* 1.2 Test Non-Deterministic Functionality */

/**
 * Tests the behaviour of the empty amb statement.
*/
function test_nondet_empty() {
    parse_and_eval("amb();");

    assert_equal(null, final_result);
}

/**
 * Tests the behaviour of an amb statement that never runs out of values.
*/
function test_nondet_infinite() {
    parse_and_eval("\
        const integer_from = n => amb(n, integer_from(n + 1)); \
        integer_from(1); \
    ");

    for (let i = 1; i <= 10; i=i+1) {
        assert_equal(i, final_result);
        try_again();
    }
}

/**
 * Tests whether 'require' conditions are satisfied in producing a result.
*/
function test_nondet_require() {
    parse_and_eval("function int_between(low, high) { \
            return low > high ? amb() : amb(low, int_between(low + 1, high)); \
        } \
        function is_divisible_by_3(x) { return (x % 3) === 0;} \
        let integer = int_between(4, 10); \
        require(is_divisible_by_3(integer)); \
        integer;"
    );

    assert_equal(6, final_result);
    try_again();
    assert_equal(9, final_result);
    try_again();
    assert_equal(null, final_result);
}

/**
 * Tests whether multiple amb statements give all combinations, in the right order.
*/
function test_nondet_combinations() {
    parse_and_eval("list(amb(1, 2, 3), amb('a', 'b'));");

    assert_equal(list(1, "a"), final_result);
    try_again();
    assert_equal(list(1, "b"), final_result);
    try_again();
    assert_equal(list(2, "a"), final_result);
    try_again();
    assert_equal(list(2, "b"), final_result);
    try_again();
    assert_equal(list(3, "a"), final_result);
    try_again();
    assert_equal(list(3, "b"), final_result);
    try_again();
    assert_equal(null, final_result);
}

/**
 * Tests whether the evaluation of a choice is undone before proceeding to the next choice.
*/
function test_nondet_undo() {
    parse_and_eval("let num = 5; \
        function reassign_num() { num = 10; return num; } \
        amb(reassign_num(), num); \
    ");

    assert_equal(10, final_result);
    try_again();
    assert_equal(5, final_result);
}

run(
    list(
    	test_self_evaluating,
    	test_assignment,
    	test_conditional_expressions,
    	test_function,
    	test_subfunction,
        test_nondet_empty,
        test_nondet_infinite,
        test_nondet_require,
        test_nondet_combinations,
        test_nondet_undo
   ), null, null, null
);