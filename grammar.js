const rust = require("tree-sitter-rust/grammar");
// https://s-arash.github.io/ascent/cc22main-p95-seamless-deductive-inference-via-macros.pdf
// Reference of "Figure 1. Grammar of Ascent rules"
//
// ⟨rule⟩        ::= ⟨head-cl⟩* <– ⟨body-cl⟩*;
// ⟨head-cl⟩     ::= ⟨ident⟩(⟨expr⟩*)
// ⟨body-cl⟩     ::= ⟨ident⟩(⟨body-arg⟩*)
//                |  if ⟨expr⟩
//                |  if let ⟨pat⟩ = ⟨expr⟩
//                |  let ⟨pat⟩ = ⟨expr⟩
//                |  for ⟨pat⟩ in ⟨expr⟩
//                |  !⟨ident⟩(⟨agg-arg⟩*)
//                |  agg ⟨pat⟩ = ⟨expr⟩(⟨ident⟩*) in ⟨ident⟩(⟨agg-arg⟩*)
//                |  (⟨disjunction⟩)
// ⟨body-arg⟩    ::= ⟨ident⟩ | ⟨expr⟩ | ?⟨pat⟩
// ⟨agg-arg⟩     ::= ⟨ident⟩ | ⟨expr⟩
// ⟨disjunction⟩ ::= ⟨body-cl⟩*
//                |  ⟨body-cl⟩* || ⟨disjunction⟩
const sepBy1 = rust.se
module.exports = grammar(rust, {
  name: 'ascent',

  extras: $ => [
    /\s/,
    $.line_comment,
  ],

  word: $ => $.identifier,

  rules: {
    // remove: rs.where_clause, rs.ordered_field_declaration_list
    struct_item: $ => seq(
      optional($.visibility_modifier),
      'struct',
      field('name', $._type_identifier),
      field('type_parameters', optional($.type_parameters)),
      ';',
    ),
    definition: $ => seq(
      choice('relation', 'lattice'),
      $.identifier, $.definition_parameters, ';'
    ),
    // deconstruct rs.reference_type to remove & mut
    reference_type: $ => seq(
      '&',
      optional($.lifetime),
      field('type', $._type),
    ),
    definition_parameters: $ => seq(
      '(',
      sepBy1(',', $._type),
      optional(','),
      ')',
    ),
    // direct rust imports
    identifier: (_, rs) => rs,
    lifetime: (_, rs) => rs,
    _type_identifier: (_, rs) => rs,
    type_parameters: (_, rs) => rs,
    visibility_modifier: (_, rs) => rs,

    comment: (_, rs) => rs,
    line_comment: (_, rs) => rs,

    _type: (_, rs) => rs,
  }
});
// lattice shortest_path(i32, i32, Dual<u32>);
// relation edge(i32, i32, u32);
//
// shortest_path(x, y, Dual(*w)) <-- edge(x, y, w);
//
// shortest_path(x, z, Dual(w + l)) <--
//    edge(x, y, w),
//    shortest_path(y, z, ?Dual(l));

// https://github.com/tree-sitter/tree-sitter-rust//blob/2d7bac5164c344c95530c16dd5c8fa1319e34308/grammar.js#L1572-L1583
/**
 * Creates a rule to match one or more of the rules separated by the separator.
 *
 * @param {RuleOrLiteral} sep - The separator to use.
 * @param {RuleOrLiteral} rule
 *
 * @return {SeqRule}
 *
 */
function sepBy1(sep, rule) {
  return seq(rule, repeat(seq(sep, rule)));
}

/**
 * Creates a rule to optionally match one or more of the rules separated by the separator.
 *
 * @param {RuleOrLiteral} sep - The separator to use.
 * @param {RuleOrLiteral} rule
 *
 * @return {ChoiceRule}
 *
 */
function sepBy(sep, rule) {
  return optional(sepBy1(sep, rule));
}
